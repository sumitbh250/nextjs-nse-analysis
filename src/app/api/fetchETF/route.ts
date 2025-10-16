import { NextResponse } from "next/server";
import axios from 'axios';
import { buildBrowserHeaders, toCookieString, delay, tryGet } from '@/lib/http';

// helpers now imported from '@/lib/http'

export async function GET() {

  try {
    // Step 1: Make the initial request to get cookies
    // Try multiple bootstrap endpoints to obtain cookies
    let cookies: string[] = [];
    let cookieString = '';

    const bootstrapUrls = [
      'https://www.nseindia.com/',
      'https://www.nseindia.com/get-quotes/equity?symbol=NIFTYBEES',
      'https://www.nseindia.com/market-data',
    ];

    for (let i = 0; i < bootstrapUrls.length && cookieString === ''; i++) {
      const url = bootstrapUrls[i];
      const resp = await tryGet(url, buildBrowserHeaders(undefined, false));
      if (resp && resp.status < 400) {
        const setCookie = resp.headers['set-cookie'] || [];
        if (setCookie.length > 0) {
          cookies.push(...setCookie);
          cookieString = toCookieString(cookies);
          break;
        }
      }
      await delay(300);
    }

    if (!cookieString) {
      console.error('Error fetching initial cookies: no cookies obtained from bootstrap');
      throw new Error('Failed to obtain cookies');
    }

    // Step 1.5: Fetch additional cookies from /get-quotes/equity?symbol=NIFTYBEES
    try {
      const niftyBeesResponse = await axios.get('https://www.nseindia.com/get-quotes/equity?symbol=NIFTYBEES', {
        headers: buildBrowserHeaders(cookieString, false),
      });

      const niftyBeesCookies = niftyBeesResponse.headers['set-cookie'] || [];
      cookies.push(...niftyBeesCookies);
      cookieString = toCookieString(cookies);
    } catch (error) {
      console.error('Error fetching NIFTYBEES cookies:', error);
      // Do not re-throw, as this is not critical
    }


    // Step 2: Use cookies to fetch data from the /etf endpoint
    // Small delay can help avoid immediate bot protection
    await delay(400);
    const etfReferer = 'https://www.nseindia.com/market-data/exchange-traded-funds-etf';
    let etfResponse = await axios.get('https://www.nseindia.com/api/etf', {
      headers: buildBrowserHeaders(cookieString, true, etfReferer),
      validateStatus: () => true,
    });

    if (etfResponse.status === 403) {
      // Refresh cookies from the ETF referer page and retry once
      try {
        const refreshResp = await axios.get(etfReferer, {
          headers: buildBrowserHeaders(cookieString, false, etfReferer),
          validateStatus: () => true,
        });
        const extra = refreshResp.headers['set-cookie'] || [];
        if (extra.length) {
          const merged = (cookieString ? cookieString.split('; ') : [])
            .concat(extra.map((c: string) => c.split(';')[0]));
          cookieString = Array.from(new Set(merged)).join('; ');
        }
      } catch (e) {
        // ignore
      }
      await delay(500);
      etfResponse = await axios.get('https://www.nseindia.com/api/etf', {
        headers: buildBrowserHeaders(cookieString, true, etfReferer),
        validateStatus: () => true,
      });
    }

    if (etfResponse.status >= 400) {
      console.error('Error fetching ETF data:', etfResponse.status, etfResponse.statusText);
      throw new Error(`ETF API error ${etfResponse.status}`);
    }

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
          headers: buildBrowserHeaders(cookieString, true),
        }).catch(error => {
          console.error(`Error fetching equity quote for ${etf.symbol}:`, error);
          return null; // Return null if there's an error fetching the equity quote
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
      } catch (error) {
        console.error(`Error during fetchEquityQuote for ${etf.symbol}:`, error);
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
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
    const errorResponse = { error: 'Error fetching ETF data' };
    const responseOptions = { status: 500 };
    return NextResponse.json(errorResponse, responseOptions);
  }
}