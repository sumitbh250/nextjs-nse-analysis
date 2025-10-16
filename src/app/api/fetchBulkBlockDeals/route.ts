import { NextResponse } from "next/server";
import axios from 'axios';
import { buildBrowserHeaders, toCookieString, delay, tryGet } from '@/lib/http';
import { fetchMarketCapMapFromSheet } from '@/lib/marketcap';
import { parseCSVToJSON } from '@/lib/csv';

// shared helpers imported

// marketcap util imported

// removed unused fetchMarketCapAndAsk; CSV parsing moved to lib

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const optionType = searchParams.get('optionType') || 'bulk_deals';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'From and To dates are required' },
        { status: 400 }
      );
    }

    // Step 1: Make the initial request to get cookies (resilient bootstrap)
    const cookies: string[] = [];
    let cookieString = '';

    const bootstrapUrls = [
      'https://www.nseindia.com/',
      'https://www.nseindia.com/get-quotes/equity?symbol=NIFTYBEES',
      'https://www.nseindia.com/market-data',
    ];

    for (let i = 0; i < bootstrapUrls.length && cookieString === ''; i++) {
      const url = bootstrapUrls[i];
      const resp = await tryGet(url, buildBrowserHeaders());
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
        headers: buildBrowserHeaders(cookieString),
      });

      const niftyBeesCookies = niftyBeesResponse.headers['set-cookie'] || [];
      cookies.push(...niftyBeesCookies);
      cookieString = toCookieString(cookies);
    } catch (error) {
      console.error('Error fetching NIFTYBEES cookies:', error);
      // Do not re-throw, as this is not critical
    }

    // Step 2: Use cookies to fetch bulk/block deals data in CSV format
    const baseUrl = 'https://www.nseindia.com/api/historicalOR/bulk-block-short-deals';
    const bulkBlockDealsUrl = `${baseUrl}?optionType=${optionType}&from=${fromDate}&to=${toDate}&csv=true`;

    const bulkBlockResponse = await axios.get(bulkBlockDealsUrl, {
      headers: {
        ...buildBrowserHeaders(cookieString),
        'Accept': 'text/csv, text/plain, */*',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
    }).catch(error => {
      console.error('Error fetching Bulk/Block deals data:', error);
      throw error;
    });

    // Step 3: Parse CSV data to JSON format
    const csvData = bulkBlockResponse.data;
    const dealsData = parseCSVToJSON(csvData);

    // Fetch market cap map from Google Sheet in parallel with any future tasks
    const marketCapMapPromise = fetchMarketCapMapFromSheet();

    // Step 4: Extract unique symbols and fetch market cap data
    if (dealsData && Array.isArray(dealsData)) {
      // Enrich response with market cap map from Google Sheet
      const marketCapMap = await marketCapMapPromise;
      const response = {
        data: dealsData,
        marketCapData: marketCapMap,
        askPriceData: {},
        totalRecords: dealsData.length,
        dataSource: 'CSV'
      };
      return NextResponse.json(response);
    }

    // Step 5: Return empty response if no data
    return NextResponse.json({
      data: [],
      totalRecords: 0,
      dataSource: 'CSV'
    });
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
    const errorResponse = { error: 'Error fetching Bulk/Block deals data' };
    const responseOptions = { status: 500 };
    return NextResponse.json(errorResponse, responseOptions);
  }
}