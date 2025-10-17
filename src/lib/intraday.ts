export interface DealData {
  BD_DT_DATE: string;
  BD_SYMBOL: string;
  BD_SCRIP_NAME: string;
  BD_CLIENT_NAME: string;
  BD_BUY_SELL: string;
  BD_QTY_TRD: number;
  BD_TP_WATP: number;
  BD_REMARKS: string;
  DEAL_TYPE?: string;
}

export function isIntradayTrade(deal: DealData, allDeals: DealData[]): boolean {
  const sameDayDeals = allDeals.filter(d => 
    d.BD_CLIENT_NAME === deal.BD_CLIENT_NAME &&
    d.BD_SYMBOL === deal.BD_SYMBOL &&
    d.BD_DT_DATE === deal.BD_DT_DATE
  );
  
  const totalBought = sameDayDeals
    .filter(d => d.BD_BUY_SELL === 'BUY')
    .reduce((sum, d) => sum + d.BD_QTY_TRD, 0);
    
  const totalSold = sameDayDeals
    .filter(d => d.BD_BUY_SELL === 'SELL')
    .reduce((sum, d) => sum + d.BD_QTY_TRD, 0);
    
  const totalVolume = totalBought + totalSold;
  
  // Buffer: 5% of total volume or 100 shares, whichever is higher
  const buffer = Math.max(100, totalVolume * 0.05);
  
  // Check if buy and sell quantities are within buffer of each other
  // This means the client roughly balanced their position on the same day
  return Math.abs(totalBought - totalSold) <= buffer;
}

export function filterIntradayDeals(deals: DealData[], hideIntraday: boolean): DealData[] {
  if (!hideIntraday) return deals;
  
  return deals.filter(deal => !isIntradayTrade(deal, deals));
}

export function getIntradayStats(deals: DealData[]): { total: number; intraday: number; filtered: number } {
  const total = deals.length;
  const intraday = deals.filter(deal => isIntradayTrade(deal, deals)).length;
  const filtered = total - intraday;
  
  return { total, intraday, filtered };
}
