import { NextResponse } from "next/server";
import axios from 'axios';

function buildBrowserHeaders(cookieString?: string, forJson: boolean = false, refererOverride?: string) {
  const headers: Record<string, string> = {
    'User-Agent':
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
      `(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36`,
    'Accept': forJson ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': refererOverride || 'https://www.nseindia.com/',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Host': 'www.nseindia.com',
    'Origin': 'https://www.nseindia.com',
    // Hints similar to Chromium
    'sec-ch-ua': '"Chromium";v="121", "Not(A:Brand";v="24", "Google Chrome";v="121"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': forJson ? 'cors' : 'navigate',
    'Sec-Fetch-Dest': forJson ? 'empty' : 'document',
  };
  if (cookieString) {
    headers['Cookie'] = cookieString;
  }
  if (forJson) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  return headers;
}

function toCookieString(setCookieHeaders: string[] | undefined): string {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return '';
  // Extract only name=value pairs from Set-Cookie headers
  const nameValuePairs = setCookieHeaders
    .map((c) => c.split(';')[0])
    .filter(Boolean);
  return nameValuePairs.join('; ');
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryGet(url: string, headers: Record<string, string>) {
  try {
    return await axios.get(url, { headers, validateStatus: () => true });
  } catch (e) {
    return undefined;
  }
}

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