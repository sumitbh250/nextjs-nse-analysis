"use client";

import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaSortUp, FaSortDown, FaSort, FaUser, FaBuilding, FaSearch } from 'react-icons/fa';
import Navigation from '@/app/component/Navigation';
import Documentation from '@/app/component/Documentation';
import { useDealPageState } from '@/lib/hooks';
import { FilterSection, PageHeader, LoadingState, EmptyState } from '@/lib/ui-components';
import { getDateRange, formatNumber, formatMarketCap, formatPrice, DealData } from '@/lib/common';
import { sortAnalyticsData } from '@/lib/analytics-utils';

interface ClientStockAnalyticsData {
  clientName: string;
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
  weightedAvgPrice: number;
  firstDealDate: string;
  lastDealDate: string;
  marketCap: number;
  price: number;
  deals: DealData[];
}

type SortField = 'clientName' | 'symbol' | 'companyName' | 'totalShares' | 'netValue' | 'totalValueBought' | 'totalValueSold' | 'dealCount' | 'avgBuyPrice' | 'avgSellPrice' | 'marketCap' | 'price';
type SortDirection = 'asc' | 'desc';

export default function ClientStockAnalyticsPage() {
  const {
    loading,
    dealsData,
    dealType,
    dateFilter,
    fromDate,
    toDate,
    hideIntraday,
    intradayStats,
    handleDealTypeChange,
    handleTimeRangeChange,
    handleIntradayToggle,
    handleDateChange,
    refreshData
  } = useDealPageState();

  const [analyticsData, setAnalyticsData] = useState<ClientStockAnalyticsData[]>([]);
  const [filteredData, setFilteredData] = useState<ClientStockAnalyticsData[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('netValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [clientFilter, setClientFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showAllDeals, setShowAllDeals] = useState<Set<string>>(new Set());

  // Process client-stock data when deals data changes
  useEffect(() => {
    if (dealsData && dealsData.deals && dealsData.deals.length > 0) {
      const aggregated = aggregateClientStockData(dealsData.deals, dealsData.marketCapData, dealsData.priceData);
      setAnalyticsData(aggregated);
      setFilteredData(aggregated);
    }
  }, [dealsData]);

  function aggregateClientStockData(deals: DealData[], marketCapData: Record<string, number> = {}, priceData: Record<string, number> = {}): ClientStockAnalyticsData[] {
    const clientStockGroups: { [key: string]: DealData[] } = {};

    // Group deals by client-stock combination
    deals.forEach(deal => {
      const key = `${deal.BD_CLIENT_NAME}|${deal.BD_SYMBOL}`;
      if (!clientStockGroups[key]) {
        clientStockGroups[key] = [];
      }
      clientStockGroups[key].push(deal);
    });

    // Process each client-stock combination
    const clientStockData = Object.entries(clientStockGroups).map(([key, deals]) => {
      const [clientName, symbol] = key.split('|');

      let totalBought = 0;
      let totalSold = 0;
      let totalValueBought = 0;
      let totalValueSold = 0;
      let buyPriceWeighted = 0;
      let sellPriceWeighted = 0;
      let totalValueWeighted = 0;
      let totalQtyForAvg = 0;

      const sortedDeals = deals.sort((a, b) => new Date(a.BD_DT_DATE).getTime() - new Date(b.BD_DT_DATE).getTime());

      deals.forEach(deal => {
        const dealValue = deal.BD_QTY_TRD * deal.BD_TP_WATP;

        if (deal.BD_BUY_SELL === 'BUY') {
          totalBought += deal.BD_QTY_TRD;
          totalValueBought += dealValue;
          buyPriceWeighted += dealValue;
        } else {
          totalSold += deal.BD_QTY_TRD;
          totalValueSold += dealValue;
          sellPriceWeighted += dealValue;
        }

        totalValueWeighted += dealValue;
        totalQtyForAvg += deal.BD_QTY_TRD;
      });

      return {
        clientName,
        symbol,
        companyName: deals[0].BD_SCRIP_NAME,
        totalShares: totalBought - totalSold,
        totalBought,
        totalSold,
        totalValueBought,
        totalValueSold,
        netValue: totalValueBought - totalValueSold,
        dealCount: deals.length,
        avgBuyPrice: totalBought > 0 ? buyPriceWeighted / totalBought : 0,
        avgSellPrice: totalSold > 0 ? sellPriceWeighted / totalSold : 0,
        weightedAvgPrice: totalQtyForAvg > 0 ? totalValueWeighted / totalQtyForAvg : 0,
        firstDealDate: sortedDeals[0].BD_DT_DATE,
        lastDealDate: sortedDeals[sortedDeals.length - 1].BD_DT_DATE,
        marketCap: marketCapData[symbol] || 0,
        price: priceData[symbol] || 0,
        deals: deals.sort((a, b) => new Date(b.BD_DT_DATE).getTime() - new Date(a.BD_DT_DATE).getTime())
      };
    });

    return clientStockData.sort((a, b) => Math.abs(b.netValue) - Math.abs(a.netValue));
  }

  function applyFilters() {
    let filtered = [...analyticsData];

    if (clientFilter.trim()) {
      filtered = filtered.filter(item =>
        item.clientName.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    if (stockFilter.trim()) {
      filtered = filtered.filter(item =>
        item.symbol.toLowerCase().includes(stockFilter.toLowerCase()) ||
        item.companyName.toLowerCase().includes(stockFilter.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  function getSortedData() {
    return sortAnalyticsData(filteredData, sortField, sortDirection);
  }

  function toggleRowExpansion(key: string) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  }

  function toggleShowAllDeals(key: string) {
    const newShowAll = new Set(showAllDeals);
    if (newShowAll.has(key)) {
      newShowAll.delete(key);
    } else {
      newShowAll.add(key);
    }
    setShowAllDeals(newShowAll);
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return <FaSort className="opacity-50" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  }

  useEffect(() => {
    applyFilters();
  }, [clientFilter, stockFilter, analyticsData]);

  const sortedData = getSortedData();
  const dateRange = getDateRange(dateFilter, fromDate, toDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <Documentation />

      <PageHeader
        title="Client-Stock Analytics"
        dateRange={dateRange}
        onRefresh={refreshData}
        loading={loading}
        intradayStats={intradayStats}
        hideIntraday={hideIntraday}
      />

      <div className="px-4 py-3">
        <FilterSection
          dealType={dealType}
          onDealTypeChange={handleDealTypeChange}
          dateFilter={dateFilter}
          onDateFilterChange={handleTimeRangeChange}
          fromDate={fromDate}
          toDate={toDate}
          onCustomDateChange={handleDateChange}
          hideIntraday={hideIntraday}
          onIntradayToggle={handleIntradayToggle}
          onRefresh={refreshData}
          loading={loading}
        />

        {/* Search Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">🔍 Filters:</span>
          <div className="flex items-center gap-2">
            <FaUser className="text-xs text-gray-500" />
            <input
              type="text"
              placeholder="Client name..."
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaBuilding className="text-xs text-gray-500" />
            <input
              type="text"
              placeholder="Stock/Company..."
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-32"
            />
          </div>
          {(clientFilter || stockFilter) && (
            <button
              onClick={() => {
                setClientFilter('');
                setStockFilter('');
              }}
              className="px-2 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading client-stock analytics..." />
      ) : sortedData.length > 0 ? (
        <div className="mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Client-Stock Analysis Results
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                {sortedData.length} client-stock combinations
              </span>
              {(clientFilter || stockFilter) && (
                <span className="text-xs font-normal text-blue-600 dark:text-blue-400 ml-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  filtered from {analyticsData.length}
                </span>
              )}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('clientName')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>CLIENT</span>
                      {getSortIcon('clientName')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('symbol')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>SYMBOL</span>
                      {getSortIcon('symbol')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    COMPANY
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('marketCap')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>MCAP</span>
                      {getSortIcon('marketCap')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('price')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>PRICE</span>
                      {getSortIcon('price')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('totalShares')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>NET QTY</span>
                      {getSortIcon('totalShares')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('netValue')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>NET VAL</span>
                      {getSortIcon('netValue')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('avgBuyPrice')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>AVG BUY</span>
                      {getSortIcon('avgBuyPrice')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('avgSellPrice')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>AVG SELL</span>
                      {getSortIcon('avgSellPrice')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('dealCount')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>DEALS</span>
                      {getSortIcon('dealCount')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    INFO
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((row) => {
                  const rowKey = `${row.clientName}-${row.symbol}`;
                  return (
                    <React.Fragment key={rowKey}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100 max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" title={row.clientName}>
                          <FaUser className="inline mr-1" size={10} />
                          {row.clientName}
                        </td>
                        <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                          {row.symbol}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" title={row.companyName}>
                          {row.companyName}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                          {formatMarketCap(row.marketCap)}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                          {formatPrice(row.price)}
                        </td>
                        <td className={`px-2 py-2 text-xs font-medium ${
                          row.totalShares > 0 ? 'text-green-600 dark:text-green-400' :
                          row.totalShares < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {row.totalShares > 0 ? '+' : ''}{formatNumber(row.totalShares)}
                        </td>
                        <td className={`px-2 py-2 text-xs font-medium ${
                          row.netValue > 0 ? 'text-green-600 dark:text-green-400' :
                          row.netValue < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          ₹{(Math.abs(row.netValue) / 10000000).toFixed(2)}Cr
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                          {row.avgBuyPrice > 0 ? `₹${row.avgBuyPrice.toFixed(1)}` : '-'}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                          {row.avgSellPrice > 0 ? `₹${row.avgSellPrice.toFixed(1)}` : '-'}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                          {row.dealCount}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => toggleRowExpansion(rowKey)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {expandedRows.has(rowKey) ?
                              <FaChevronDown size={12} /> :
                              <FaChevronRight size={12} />
                            }
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {expandedRows.has(rowKey) && (
                        <tr>
                          <td colSpan={9} className="px-2 py-3 bg-gray-50 dark:bg-gray-800">
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                                <span>👤 Client: <strong>{row.clientName}</strong></span>
                                <span>🏢 Stock: <strong>{row.symbol}</strong></span>
                                <span>📊 Net Position: <strong className={row.netValue > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {row.netValue > 0 ? '+' : ''}₹{(row.netValue / 10000000).toFixed(2)}Cr
                                </strong></span>
                                <span>📅 Period: <strong>{row.firstDealDate} to {row.lastDealDate}</strong></span>
                                <span>💰 Weighted Avg: <strong>₹{row.weightedAvgPrice.toFixed(1)}</strong></span>
                              </div>

                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Individual Deals</span>
                                {row.deals.length > 5 && (
                                  <button
                                    onClick={() => toggleShowAllDeals(rowKey)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    {showAllDeals.has(rowKey) ? 'Show Less' : `Show All ${row.deals.length} Deals`}
                                  </button>
                                )}
                              </div>

                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-300 dark:border-gray-600">
                                      <th className="text-left py-1 px-2 font-medium">Date</th>
                                      <th className="text-left py-1 px-2 font-medium">Deal Type</th>
                                      <th className="text-left py-1 px-2 font-medium">Buy/Sell</th>
                                      <th className="text-left py-1 px-2 font-medium">Qty</th>
                                      <th className="text-left py-1 px-2 font-medium">Price</th>
                                      <th className="text-left py-1 px-2 font-medium">Value</th>
                                      <th className="text-left py-1 px-2 font-medium">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(showAllDeals.has(rowKey) ? row.deals : row.deals.slice(0, 5)).map((deal, index) => (
                                      <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                        <td className="py-1 px-2">{deal.BD_DT_DATE}</td>
                                        <td className="py-1 px-2">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            deal.DEAL_TYPE === 'BULK' 
                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                              : deal.DEAL_TYPE === 'BLOCK'
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                          }`}>
                                            {deal.DEAL_TYPE || 'N/A'}
                                          </span>
                                        </td>
                                        <td className={`py-1 px-2 font-medium ${
                                          deal.BD_BUY_SELL === 'BUY' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {deal.BD_BUY_SELL}
                                        </td>
                                        <td className="py-1 px-2">{formatNumber(deal.BD_QTY_TRD)}</td>
                                        <td className="py-1 px-2">₹{deal.BD_TP_WATP.toFixed(1)}</td>
                                        <td className="py-1 px-2">₹{((deal.BD_QTY_TRD * deal.BD_TP_WATP) / 10000000).toFixed(2)}Cr</td>
                                        <td className="py-1 px-2 max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" title={deal.BD_REMARKS}>
                                          {deal.BD_REMARKS || '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="👥🏢"
          title="No client-stock data available"
          subtitle={analyticsData.length === 0 ? 
            'Select a date range and deal type to view analytics' : 
            'No results match your current filters'
          }
        />
      )}
    </div>
  );
}