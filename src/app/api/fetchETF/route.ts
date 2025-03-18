import { NextResponse } from "next/server";
import axios from 'axios';

export async function GET() {

  try {
    // Step 1: Make the initial request to get cookies
    const initialResponse = await axios.get('https://www.nseindia.com', {
      headers: {
        'User-Agent':
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
          `(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`,
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,' +
          'image/avif,image/webp,image/apng,*/*;q=0.8',
      },
    });

    const cookies = initialResponse.headers['set-cookie'] || [];

    // Step 2: Use cookies to fetch data from the /etf endpoint
    const etfResponse = await axios.get('https://www.nseindia.com/api/etf', {
      headers: {
        'User-Agent':
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
          `(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`,
        'Accept': 'application/json, text/plain, */*',
        'Cookie': cookies.join('; '),
      },
    });

    // Filter out ETFs with low quantity and calculate undervalued percentage
    const etfData = etfResponse.data.data;
    const filteredEtfData = etfData.filter((etf: any) =>
      etf.nav &&
      etf.ltP &&
      etf.qty &&
      etf.qty > 100000
    );
    etfResponse.data.data = filteredEtfData;

    const fetchEquityQuote = async (etf: any) => {
      try {
      const equityQuoteResponse = await axios.get(`https://www.nseindia.com/api/quote-equity?symbol=${etf.symbol}`, {
        headers: {
        'User-Agent':
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
          `(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`,
        'Accept': 'application/json, text/plain, */*',
        'Cookie': cookies.join('; '),
        },
      });
      const equityQuote = equityQuoteResponse.data;
      if (!equityQuote.priceInfo || !equityQuote.priceInfo.iNavValue) {
        return null; // Return null if priceInfo or iNavValue is missing
      }

      const inav = equityQuote.priceInfo.iNavValue;

      return {
        ...etf,
        inav,
        undervalued_pct: ((inav - etf.ltP) / inav * 100).toFixed(2),
        undervalued: ((inav - etf.ltP) / inav * 100) > 0,
        companyName: etf.meta.companyName,
      };
      } catch {
      return null; // Return null if there's an error fetching the equity quote
      }
    };

    const updatedEtfs = await Promise.all(
      etfResponse.data.data.map((etf: any) => fetchEquityQuote(etf))
    );

    etfResponse.data.data = updatedEtfs.filter((etf: any) => etf !== null);
    etfResponse.data.data.sort(
      (a: any, b: any) => b.undervalued_pct - a.undervalued_pct
    );

    // Step 3: Return the data from /etf to the client
    return NextResponse.json(etfResponse.data);
  } catch (error:any) {
    console.error('Error fetching data:', error.message);
    const errorResponse = { error: 'Error fetching ETF data' };
    const responseOptions = { status: 500 };
    return NextResponse.json(errorResponse, responseOptions);
  }
}