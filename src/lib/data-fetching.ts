// Common data fetching utilities for deal-related pages

import { DealData, ERROR_MESSAGES, validateDateRange, formatDateForAPI } from './common';
import { processBulkBlockDeals, addDealType } from './deduplication';
import { filterIntradayDeals, getIntradayStats } from './intraday';

export interface FetchDealsResult {
  deals: DealData[];
  marketCapData: Record<string, number>;
  priceData: Record<string, number>;
  intradayStats: { total: number; intraday: number; filtered: number };
}

/**
 * Fetches and processes deals data with deduplication and intraday filtering
 */
export async function fetchDealsData(
  dealType: string,
  fromDate: string,
  toDate: string,
  hideIntraday: boolean = true
): Promise<FetchDealsResult> {
  // Validate inputs
  if (!validateDateRange(fromDate, toDate)) {
    throw new Error(ERROR_MESSAGES.INVALID_DATE_RANGE);
  }

  let allDeals: DealData[] = [];
  let marketCapData: Record<string, number> = {};
  let priceData: Record<string, number> = {};

  // Convert dates to DD-MM-YYYY format for NSE API
  const fromDateFormatted = formatDateForAPI(fromDate);
  const toDateFormatted = formatDateForAPI(toDate);

  if (dealType === 'both') {
    // Fetch both bulk and block deals
    const [bulkResponse, blockResponse] = await Promise.all([
      fetch(`/api/fetchBulkBlockDeals?optionType=bulk_deals&from=${fromDateFormatted}&to=${toDateFormatted}`),
      fetch(`/api/fetchBulkBlockDeals?optionType=block_deals&from=${fromDateFormatted}&to=${toDateFormatted}`)
    ]);

    const [bulkData, blockData] = await Promise.all([
      bulkResponse.json(),
      blockResponse.json()
    ]);

    // Process and deduplicate deals using utility
    const deduplicationResult = processBulkBlockDeals(bulkData, blockData);
    allDeals = deduplicationResult.deals;
    
    // Use market cap and price data from either response (they should be the same)
    marketCapData = (bulkData && bulkData.marketCapData) ? bulkData.marketCapData : {};
    priceData = (bulkData && bulkData.priceData) ? bulkData.priceData : {};
  } else {
    // Fetch single type
    const response = await fetch(
      `/api/fetchBulkBlockDeals?optionType=${dealType}&from=${fromDateFormatted}&to=${toDateFormatted}`
    );
    const data = await response.json();
    
    allDeals = addDealType(data.data || [], dealType as 'bulk_deals' | 'block_deals');
    marketCapData = (data && data.marketCapData) ? data.marketCapData : {};
    priceData = (data && data.priceData) ? data.priceData : {};
  }

  // Apply intraday filtering
  const filteredDeals = filterIntradayDeals(allDeals, hideIntraday);
  const intradayStats = getIntradayStats(allDeals);

  return {
    deals: filteredDeals,
    marketCapData,
    priceData,
    intradayStats
  };
}