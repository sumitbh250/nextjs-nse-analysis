// Analytics utility functions

import { DealData, formatNumber, formatMarketCap, formatPrice } from './common';
import { AggregatedData, DateAggregatedData, SortField, SortDirection } from './hooks';

// Additional interfaces for client analytics
export interface ClientStockData {
  symbol: string;
  companyName: string;
  totalShares: number; // net position (bought - sold)
  totalBought: number;
  totalSold: number;
  totalValueBought: number;
  totalValueSold: number;
  netValue: number;
  dealCount: number;
  avgBuyPrice: number;
  avgSellPrice: number;
  deals: DealData[];
}

export interface ClientAnalyticsData {
  clientName: string;
  totalBought: number; // total shares bought across all stocks
  totalSold: number; // total shares sold across all stocks
  totalValueBought: number; // total value bought
  totalValueSold: number; // total value sold
  netValue: number; // net value (bought - sold)
  uniqueStocks: number;
  totalDeals: number;
  stockData: ClientStockData[];
}

/**
 * Aggregates client data from deals
 */
export function aggregateClientData(deals: DealData[]): ClientAnalyticsData[] {
  const clientGroups: { [clientName: string]: { [symbol: string]: DealData[] } } = {};

  // Group deals by client and then by symbol
  deals.forEach(deal => {
    if (!clientGroups[deal.BD_CLIENT_NAME]) {
      clientGroups[deal.BD_CLIENT_NAME] = {};
    }
    if (!clientGroups[deal.BD_CLIENT_NAME][deal.BD_SYMBOL]) {
      clientGroups[deal.BD_CLIENT_NAME][deal.BD_SYMBOL] = [];
    }
    clientGroups[deal.BD_CLIENT_NAME][deal.BD_SYMBOL].push(deal);
  });

  // Process each client
  const clientData = Object.entries(clientGroups).map(([clientName, symbolDeals]) => {
    let totalBought = 0;
    let totalSold = 0;
    let totalValueBought = 0;
    let totalValueSold = 0;
    let totalDeals = 0;

    const stockData: ClientStockData[] = Object.entries(symbolDeals).map(([symbol, deals]) => {
      let stockBought = 0;
      let stockSold = 0;
      let stockValueBought = 0;
      let stockValueSold = 0;
      let buyPriceWeighted = 0;
      let sellPriceWeighted = 0;

      deals.forEach(deal => {
        const dealValue = deal.BD_QTY_TRD * deal.BD_TP_WATP;

        if (deal.BD_BUY_SELL === 'BUY') {
          stockBought += deal.BD_QTY_TRD;
          stockValueBought += dealValue;
          buyPriceWeighted += dealValue;
        } else {
          stockSold += deal.BD_QTY_TRD;
          stockValueSold += dealValue;
          sellPriceWeighted += dealValue;
        }
      });

      totalBought += stockBought;
      totalSold += stockSold;
      totalValueBought += stockValueBought;
      totalValueSold += stockValueSold;
      totalDeals += deals.length;

      return {
        symbol,
        companyName: deals[0].BD_SCRIP_NAME,
        totalShares: stockBought - stockSold,
        totalBought: stockBought,
        totalSold: stockSold,
        totalValueBought: stockValueBought,
        totalValueSold: stockValueSold,
        netValue: stockValueBought - stockValueSold,
        dealCount: deals.length,
        avgBuyPrice: stockBought > 0 ? buyPriceWeighted / stockBought : 0,
        avgSellPrice: stockSold > 0 ? sellPriceWeighted / stockSold : 0,
        deals: deals.sort((a, b) => new Date(b.BD_DT_DATE).getTime() - new Date(a.BD_DT_DATE).getTime())
      };
    });

    return {
      clientName,
      totalBought,
      totalSold,
      totalValueBought,
      totalValueSold,
      netValue: totalValueBought - totalValueSold,
      uniqueStocks: stockData.length,
      totalDeals,
      stockData: stockData.sort((a, b) => Math.abs(b.netValue) - Math.abs(a.netValue))
    };
  });

  return clientData.sort((a, b) => b.totalValueBought - a.totalValueBought);
}

/**
 * Aggregates deals data by symbol
 */
export function aggregateDealsData(
  deals: DealData[], 
  marketCapData: { [key: string]: number } = {}, 
  priceData: { [key: string]: number } = {}, 
  askPriceData: { [key: string]: number } = {}
): AggregatedData[] {
  const grouped = deals.reduce((acc, deal) => {
    const key = deal.BD_SYMBOL;
    if (!acc[key]) {
      acc[key] = {
        symbol: deal.BD_SYMBOL,
        companyName: deal.BD_SCRIP_NAME,
        totalBought: 0,
        totalSold: 0,
        totalValueBought: 0,
        totalValueSold: 0,
        netPosition: 0,
        netValue: 0,
        dealCount: 0,
        uniqueClients: new Set(),
        prices: [],
        deals: []
      };
    }

    const dealValue = deal.BD_QTY_TRD * deal.BD_TP_WATP;

    if (deal.BD_BUY_SELL === 'BUY') {
      acc[key].totalBought += deal.BD_QTY_TRD;
      acc[key].totalValueBought += dealValue;
    } else {
      acc[key].totalSold += deal.BD_QTY_TRD;
      acc[key].totalValueSold += dealValue;
    }

    acc[key].uniqueClients.add(deal.BD_CLIENT_NAME);
    acc[key].prices.push(deal.BD_TP_WATP);
    acc[key].deals.push(deal);
    acc[key].dealCount++;

    return acc;
  }, {} as any);

  const aggregatedData = Object.values(grouped).map((item: any) => ({
    symbol: item.symbol,
    companyName: item.companyName,
    totalBought: item.totalBought,
    totalSold: item.totalSold,
    totalValueBought: item.totalValueBought,
    totalValueSold: item.totalValueSold,
    netPosition: item.totalBought - item.totalSold,
    netValue: item.totalValueBought - item.totalValueSold,
    dealCount: item.dealCount,
    uniqueClients: item.uniqueClients.size,
    avgDealSize: (item.totalBought + item.totalSold) / item.dealCount,
    minPrice: Math.min(...item.prices),
    maxPrice: Math.max(...item.prices),
    marketCap: marketCapData[item.symbol] || 0,
    price: priceData[item.symbol] || 0,
    askPrice: askPriceData[item.symbol] || 0,
    deals: item.deals.sort((a: DealData, b: DealData) => b.BD_QTY_TRD - a.BD_QTY_TRD)
  }));

  return aggregatedData;
}

/**
 * Aggregates client data for a specific symbol
 */
export function aggregateClientDataForSymbol(deals: DealData[], symbol: string): any[] {
  const clientDeals = deals.filter(deal => deal.BD_SYMBOL === symbol);
  const grouped = clientDeals.reduce((acc, deal) => {
    const key = deal.BD_CLIENT_NAME;
    if (!acc[key]) {
      acc[key] = {
        clientName: deal.BD_CLIENT_NAME,
        symbol: deal.BD_SYMBOL,
        companyName: deal.BD_SCRIP_NAME,
        totalShares: 0,
        totalValue: 0,
        dealCount: 0,
        totalPriceWeighted: 0,
        deals: []
      };
    }

    const dealValue = deal.BD_QTY_TRD * deal.BD_TP_WATP;

    if (deal.BD_BUY_SELL === 'BUY') {
      acc[key].totalShares += deal.BD_QTY_TRD;
    } else {
      acc[key].totalShares -= deal.BD_QTY_TRD;
    }

    acc[key].totalValue += dealValue;
    acc[key].totalPriceWeighted += dealValue;
    acc[key].deals.push(deal);
    acc[key].dealCount++;

    return acc;
  }, {} as any);

  const clientData = Object.values(grouped).map((item: any) => ({
    clientName: item.clientName,
    symbol: item.symbol,
    companyName: item.companyName,
    totalShares: item.totalShares,
    totalValue: item.totalValue,
    dealCount: item.dealCount,
    avgPrice: item.totalPriceWeighted / (item.deals.reduce((sum: number, deal: DealData) => sum + deal.BD_QTY_TRD, 0)),
    deals: item.deals.sort((a: DealData, b: DealData) => new Date(b.BD_DT_DATE).getTime() - new Date(a.BD_DT_DATE).getTime())
  }));

  return clientData.sort((a, b) => Math.abs(b.totalValue) - Math.abs(a.totalValue));
}

/**
 * Aggregates date data for a specific symbol
 */
export function aggregateDateDataForSymbol(deals: DealData[], symbol: string): DateAggregatedData[] {
  const symbolDeals = deals.filter(deal => deal.BD_SYMBOL === symbol);
  const grouped = symbolDeals.reduce((acc, deal) => {
    const key = deal.BD_DT_DATE;
    if (!acc[key]) {
      acc[key] = {
        date: deal.BD_DT_DATE,
        symbol: deal.BD_SYMBOL,
        companyName: deal.BD_SCRIP_NAME,
        totalBought: 0,
        totalSold: 0,
        totalValueBought: 0,
        totalValueSold: 0,
        netPosition: 0,
        netValue: 0,
        dealCount: 0,
        uniqueClients: new Set(),
        deals: []
      };
    }

    const dealValue = deal.BD_QTY_TRD * deal.BD_TP_WATP;

    if (deal.BD_BUY_SELL === 'BUY') {
      acc[key].totalBought += deal.BD_QTY_TRD;
      acc[key].totalValueBought += dealValue;
    } else {
      acc[key].totalSold += deal.BD_QTY_TRD;
      acc[key].totalValueSold += dealValue;
    }

    acc[key].uniqueClients.add(deal.BD_CLIENT_NAME);
    acc[key].deals.push(deal);
    acc[key].dealCount++;

    return acc;
  }, {} as any);

  const dateData = Object.values(grouped).map((item: any) => ({
    date: item.date,
    symbol: item.symbol,
    companyName: item.companyName,
    totalBought: item.totalBought,
    totalSold: item.totalSold,
    totalValueBought: item.totalValueBought,
    totalValueSold: item.totalValueSold,
    netPosition: item.totalBought - item.totalSold,
    netValue: item.totalValueBought - item.totalValueSold,
    dealCount: item.dealCount,
    uniqueClients: item.uniqueClients.size,
    deals: item.deals.sort((a: DealData, b: DealData) => b.BD_QTY_TRD - a.BD_QTY_TRD)
  }));

  return dateData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Sorts analytics data by field and direction
 */
export function sortAnalyticsData<T>(
  data: T[],
  field: keyof T | string,
  direction: SortDirection
): T[] {
  return [...data].sort((a, b) => {
    const aVal = (a as any)[field];
    const bVal = (b as any)[field];
    const multiplier = direction === 'asc' ? 1 : -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * multiplier;
    }
    return (Number(aVal) - Number(bVal)) * multiplier;
  });
}

