import { DealData } from './intraday';

export interface DeduplicationResult {
  deals: DealData[];
  stats: {
    total: number;
    duplicates: number;
    unique: number;
  };
}

/**
 * Deduplicates deals based on key fields including buy/sell status
 * @param bulkDeals Array of bulk deals with DEAL_TYPE: 'BULK'
 * @param blockDeals Array of block deals with DEAL_TYPE: 'BLOCK'
 * @returns DeduplicationResult with filtered deals and statistics
 */
export function deduplicateBulkBlockDeals(
  bulkDeals: DealData[], 
  blockDeals: DealData[]
): DeduplicationResult {
  // Combine all deals
  const allDeals = [...bulkDeals, ...blockDeals];
  const dealMap = new Map();
  let duplicateCount = 0;
  
  allDeals.forEach(deal => {
    // Create a unique key based on date, symbol, client, quantity, price, and buy/sell
    const key = `${deal.BD_DT_DATE}-${deal.BD_SYMBOL}-${deal.BD_CLIENT_NAME}-${deal.BD_QTY_TRD}-${deal.BD_TP_WATP}-${deal.BD_BUY_SELL}`;
    
    if (!dealMap.has(key)) {
      dealMap.set(key, deal);
    } else {
      // If duplicate found, mark it as having both types
      const existing = dealMap.get(key);
      dealMap.set(key, {
        ...existing,
        DEAL_TYPE: existing.DEAL_TYPE === deal.DEAL_TYPE ? existing.DEAL_TYPE : 'BOTH'
      });
      duplicateCount++;
    }
  });
  
  const uniqueDeals = Array.from(dealMap.values());
  
  return {
    deals: uniqueDeals,
    stats: {
      total: allDeals.length,
      duplicates: duplicateCount,
      unique: uniqueDeals.length
    }
  };
}

/**
 * Adds deal type to deals based on the source
 * @param deals Array of deals
 * @param dealType Type of deals ('bulk_deals' or 'block_deals')
 * @returns Array of deals with DEAL_TYPE added
 */
export function addDealType(deals: DealData[], dealType: 'bulk_deals' | 'block_deals'): DealData[] {
  return deals.map(deal => ({
    ...deal,
    DEAL_TYPE: dealType === 'bulk_deals' ? 'BULK' : 'BLOCK'
  }));
}

/**
 * Processes and deduplicates deals from API responses
 * @param bulkData API response for bulk deals
 * @param blockData API response for block deals
 * @returns Processed and deduplicated deals
 */
export function processBulkBlockDeals(bulkData: any, blockData: any): DeduplicationResult {
  // Add deal type to each deal
  const bulkDeals = addDealType(bulkData.data || [], 'bulk_deals');
  const blockDeals = addDealType(blockData.data || [], 'block_deals');
  
  // Deduplicate and return
  return deduplicateBulkBlockDeals(bulkDeals, blockDeals);
}
