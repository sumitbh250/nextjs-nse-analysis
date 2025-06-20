import { NextResponse } from "next/server";
import axios from 'axios';

async function fetchMarketCap(symbol: string, cookies: string[]): Promise<number> {
  try {
    const response = await axios.get(`https://www.nseindia.com/api/quote-equity?symbol=${symbol}&section=trade_info`, {
      headers: {
        'User-Agent':
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
          `(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`,
        'Accept': 'application/json, text/plain, */*',
        'Cookie': cookies.join('; '),
      },
    });

    // Use totalMarketCap directly from the API response (already in crores)
    const totalMarketCap = response.data.marketDeptOrderBook?.tradeInfo?.totalMarketCap || 0;
    return totalMarketCap;
  } catch (error) {
    console.error(`Error fetching market cap for ${symbol}:`, error);
    return 0;
  }
}

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
    }).catch(error => {
      console.error('Error fetching initial cookies:', error);
      throw error;
    });

    const cookies = initialResponse.headers['set-cookie'] || [];

    // Step 1.5: Fetch additional cookies from /get-quotes/equity?symbol=NIFTYBEES
    try {
      const niftyBeesResponse = await axios.get('https://www.nseindia.com/get-quotes/equity?symbol=NIFTYBEES', {
        headers: {
          'User-Agent':
            `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
            `(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`,
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,' +
            'image/avif,image/webp,image/apng,*/*;q=0.8',
        },
      });

      const niftyBeesCookies = niftyBeesResponse.headers['set-cookie'] || [];
      cookies.push(...niftyBeesCookies);
    } catch (error) {
      console.error('Error fetching NIFTYBEES cookies:', error);
      // Do not re-throw, as this is not critical
    }

    // Step 2: Use cookies to fetch bulk/block deals data
    const baseUrl = 'https://www.nseindia.com/api/historicalOR/bulk-block-short-deals';
    const bulkBlockDealsUrl = `${baseUrl}?optionType=${optionType}&from=${fromDate}&to=${toDate}`;

    const bulkBlockResponse = await axios.get(bulkBlockDealsUrl, {
      headers: {
        'User-Agent':
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
          `(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`,
        'Accept': 'application/json, text/plain, */*',
        'Cookie': cookies.join('; '),
      },
    }).catch(error => {
      console.error('Error fetching Bulk/Block deals data:', error);
      throw error;
    });

    // Step 3: Extract unique symbols and fetch market cap data
    const dealsData = bulkBlockResponse.data;
    if (dealsData && dealsData.data && Array.isArray(dealsData.data)) {
      const uniqueSymbols = [...new Set(dealsData.data.map((deal: any) => deal.BD_SYMBOL))];

      // Fetch market cap for all unique symbols
      const marketCapPromises = uniqueSymbols.map(symbol =>
        fetchMarketCap(symbol as string, cookies)
      );

      try {
        const marketCaps = await Promise.all(marketCapPromises);

        // Create a map of symbol to market cap
        const marketCapMap: { [key: string]: number } = {};
        uniqueSymbols.forEach((symbol, index) => {
          marketCapMap[symbol as string] = marketCaps[index];
        });

        // Add market cap to each deal record
        dealsData.data = dealsData.data.map((deal: any) => ({
          ...deal,
          marketCap: marketCapMap[deal.BD_SYMBOL] || 0
        }));

        // Add market cap mapping to response for easy access
        dealsData.marketCapData = marketCapMap;

      } catch (error) {
        console.error('Error fetching market cap data:', error);
        // Continue without market cap data if it fails
      }
    }

    // Step 4: Return the enhanced data to the client
    return NextResponse.json(dealsData);
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
    const errorResponse = { error: 'Error fetching Bulk/Block deals data' };
    const responseOptions = { status: 500 };
    return NextResponse.json(errorResponse, responseOptions);
  }
}