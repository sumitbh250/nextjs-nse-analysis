import { NextResponse } from "next/server";
import axios from 'axios';

async function fetchMarketCapAndAsk(symbol: string, cookies: string[]): Promise<{marketCap: number, askPrice: number}> {
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

    // Get lowest ask price (first element in ask array)
    const askPrice = response.data.marketDeptOrderBook?.ask?.[0]?.price || 0;

    return { marketCap: totalMarketCap, askPrice };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    return { marketCap: 0, askPrice: 0 };
  }
}

function parseCSVToJSON(csvData: string) {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip the header line and parse data
  const dataLines = lines.slice(1);
  const deals = [];

  for (const line of dataLines) {
    // Parse CSV line (handling quoted fields)
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim()); // Add the last field

    if (fields.length >= 7) {
      // Convert CSV format to our JSON format
      const deal = {
        BD_DT_DATE: fields[0].replace(/"/g, ''),
        BD_DT_ORDER: new Date(fields[0].replace(/"/g, '')).toISOString(),
        BD_SYMBOL: fields[1].replace(/"/g, ''),
        BD_SCRIP_NAME: fields[2].replace(/"/g, ''),
        BD_CLIENT_NAME: fields[3].replace(/"/g, ''),
        BD_BUY_SELL: fields[4].replace(/"/g, ''),
        BD_QTY_TRD: parseInt(fields[5].replace(/"/g, '').replace(/,/g, '')),
        BD_TP_WATP: parseFloat(fields[6].replace(/"/g, '').replace(/,/g, '')),
        BD_REMARKS: fields[7] ? fields[7].replace(/"/g, '') : '-'
      };
      deals.push(deal);
    }
  }

  return deals;
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

    // Step 2: Use cookies to fetch bulk/block deals data in CSV format
    const baseUrl = 'https://www.nseindia.com/api/historicalOR/bulk-block-short-deals';
    const bulkBlockDealsUrl = `${baseUrl}?optionType=${optionType}&from=${fromDate}&to=${toDate}&csv=true`;

    const bulkBlockResponse = await axios.get(bulkBlockDealsUrl, {
      headers: {
        'User-Agent':
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
          `(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`,
        'Accept': 'text/csv, text/plain, */*',
        'Cookie': cookies.join('; '),
      },
    }).catch(error => {
      console.error('Error fetching Bulk/Block deals data:', error);
      throw error;
    });

    // Step 3: Parse CSV data to JSON format
    const csvData = bulkBlockResponse.data;
    const dealsData = parseCSVToJSON(csvData);

    // Step 4: Extract unique symbols and fetch market cap data
    if (dealsData && Array.isArray(dealsData)) {
      const uniqueSymbols = [...new Set(dealsData.map((deal: any) => deal.BD_SYMBOL))];

      // COMMENTED OUT: Fetch market cap and ask price for all unique symbols
      /*
      const marketDataPromises = uniqueSymbols.map(symbol =>
        fetchMarketCapAndAsk(symbol as string, cookies)
      );
      */

      // COMMENTED OUT: Market data processing
      /*
      try {
        const marketDataResults = await Promise.all(marketDataPromises);

        // Create maps for market cap and ask prices
        const marketCapMap: { [key: string]: number } = {};
        const askPriceMap: { [key: string]: number } = {};
        uniqueSymbols.forEach((symbol, index) => {
          marketCapMap[symbol as string] = marketDataResults[index].marketCap;
          askPriceMap[symbol as string] = marketDataResults[index].askPrice;
        });

        // Add market cap and ask price to each deal record
        const enhancedDealsData = dealsData.map((deal: any) => ({
          ...deal,
          marketCap: marketCapMap[deal.BD_SYMBOL] || 0,
          askPrice: askPriceMap[deal.BD_SYMBOL] || 0
        }));

        // Return data in the same format as before
        const response = {
          data: enhancedDealsData,
          marketCapData: marketCapMap,
          askPriceData: askPriceMap,
          totalRecords: enhancedDealsData.length,
          dataSource: 'CSV' // Indicator that we used CSV format
        };

        return NextResponse.json(response);

      } catch (error) {
        console.error('Error fetching market data:', error);
        // Continue without market data if it fails
        const response = {
          data: dealsData,
          totalRecords: dealsData.length,
          dataSource: 'CSV'
        };
        return NextResponse.json(response);
      }
      */

      // Return data without market cap and ask price for now
      const response = {
        data: dealsData,
        marketCapData: {},
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