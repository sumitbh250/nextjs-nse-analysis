"use client";

import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaSortUp, FaSortDown, FaSort, FaUser, FaBuilding } from 'react-icons/fa';
import Navigation from '@/app/component/Navigation';
import Documentation from '@/app/component/Documentation';
import { useDealPageState } from '@/lib/hooks';
import { FilterSection, PageHeader, LoadingState, EmptyState } from '@/lib/ui-components';
import { getDateRange, formatNumber, DealData } from '@/lib/common';
import { aggregateClientData, sortAnalyticsData, ClientAnalyticsData, ClientStockData } from '@/lib/analytics-utils';

type SortField = 'clientName' | 'totalValueBought' | 'totalValueSold' | 'netValue' | 'uniqueStocks' | 'totalDeals';
type SortDirection = 'asc' | 'desc';
type ExpandedViewMode = 'stocks' | 'deals';

export default function ClientAnalyticsPage() {
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

  const [clientData, setClientData] = useState<ClientAnalyticsData[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('totalValueBought');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedViewMode, setExpandedViewMode] = useState<Map<string, ExpandedViewMode>>(new Map());
  const [showAllStocks, setShowAllStocks] = useState<Set<string>>(new Set());

  // Process client data when deals data changes
  useEffect(() => {
    if (dealsData && dealsData.deals && dealsData.deals.length > 0) {
      const aggregated = aggregateClientData(dealsData.deals);
      setClientData(aggregated);
    }
  }, [dealsData]);


  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  function getSortedData() {
    return sortAnalyticsData(clientData, sortField as any, sortDirection);
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

  function toggleShowAllStocks(key: string) {
    const newShowAll = new Set(showAllStocks);
    if (newShowAll.has(key)) {
      newShowAll.delete(key);
    } else {
      newShowAll.add(key);
    }
    setShowAllStocks(newShowAll);
  }

  function getExpandedViewMode(clientName: string): ExpandedViewMode {
    return expandedViewMode.get(clientName) || 'stocks';
  }

  function setExpandedViewModeForClient(clientName: string, mode: ExpandedViewMode) {
    const newExpandedViewMode = new Map(expandedViewMode);
    newExpandedViewMode.set(clientName, mode);
    setExpandedViewMode(newExpandedViewMode);
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return <FaSort className="opacity-50" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  }

  const sortedData = getSortedData();
  const dateRange = getDateRange(dateFilter, fromDate, toDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <Documentation />

      <PageHeader
        title="Client Analytics"
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
      </div>

      {loading ? (
        <LoadingState message="Loading client analytics..." />
      ) : sortedData.length > 0 ? (
        <div className="mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Client Analysis Results
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                {sortedData.length} clients
              </span>
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
                    QTY B
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    QTY S
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('totalValueBought')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>VAL B</span>
                      {getSortIcon('totalValueBought')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('totalValueSold')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>VAL S</span>
                      {getSortIcon('totalValueSold')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('netValue')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>NET</span>
                      {getSortIcon('netValue')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('uniqueStocks')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>STOCKS</span>
                      {getSortIcon('uniqueStocks')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('totalDeals')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>DEALS</span>
                      {getSortIcon('totalDeals')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    INFO
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((client) => (
                  <React.Fragment key={client.clientName}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100 max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[350px] truncate" title={client.clientName}>
                        <FaUser className="inline mr-1" size={10} />
                        {client.clientName}
                      </td>
                      <td className="px-2 py-2 text-xs text-green-600 dark:text-green-400">
                        {formatNumber(client.totalBought)}
                      </td>
                      <td className="px-2 py-2 text-xs text-red-600 dark:text-red-400">
                        {formatNumber(client.totalSold)}
                      </td>
                      <td className="px-2 py-2 text-xs text-green-600 dark:text-green-400">
                        ₹{(client.totalValueBought / 10000000).toFixed(1)}Cr
                      </td>
                      <td className="px-2 py-2 text-xs text-red-600 dark:text-red-400">
                        ₹{(client.totalValueSold / 10000000).toFixed(1)}Cr
                      </td>
                      <td className={`px-2 py-2 text-xs font-medium ${
                        client.netValue > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        ₹{(Math.abs(client.netValue) / 10000000).toFixed(1)}Cr
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        {client.uniqueStocks}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        {client.totalDeals}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => toggleRowExpansion(client.clientName)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {expandedRows.has(client.clientName) ?
                            <FaChevronDown size={12} /> :
                            <FaChevronRight size={12} />
                          }
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Client Details */}
                    {expandedRows.has(client.clientName) && (
                      <tr>
                        <td colSpan={9} className="px-2 py-3 bg-gray-50 dark:bg-gray-800">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <span>👤 Client: <strong>{client.clientName}</strong></span>
                              <span>📊 Net Position: <strong className={client.netValue > 0 ? 'text-green-600' : 'text-red-600'}>
                                {client.netValue > 0 ? '+' : ''}₹{(client.netValue / 10000000).toFixed(2)}Cr
                              </strong></span>
                              <span>🎯 Active Stocks: <strong>{client.uniqueStocks}</strong></span>
                              <span>📋 Total Deals: <strong>{client.totalDeals}</strong></span>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">View:</span>
                              <button
                                onClick={() => setExpandedViewModeForClient(client.clientName, 'stocks')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                                  getExpandedViewMode(client.clientName) === 'stocks'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                }`}
                              >
                                🏢 Per Stock Summary
                              </button>
                              <button
                                onClick={() => setExpandedViewModeForClient(client.clientName, 'deals')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                                  getExpandedViewMode(client.clientName) === 'deals'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                }`}
                              >
                                📋 All Deals
                              </button>
                            </div>

                            {getExpandedViewMode(client.clientName) === 'stocks' ? (
                              <>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Stock-wise Breakdown</span>
                                  {client.stockData.length > 5 && (
                                    <button
                                      onClick={() => toggleShowAllStocks(client.clientName)}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      {showAllStocks.has(client.clientName) ? 'Show Less' : `Show All ${client.stockData.length} Stocks`}
                                    </button>
                                  )}
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-300 dark:border-gray-600">
                                        <th className="text-left py-1 px-2 font-medium">Symbol</th>
                                        <th className="text-left py-1 px-2 font-medium">Company</th>
                                        <th className="text-left py-1 px-2 font-medium">Net Qty</th>
                                        <th className="text-left py-1 px-2 font-medium">Net Value</th>
                                        <th className="text-left py-1 px-2 font-medium">Avg Buy</th>
                                        <th className="text-left py-1 px-2 font-medium">Avg Sell</th>
                                        <th className="text-left py-1 px-2 font-medium">Deals</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(showAllStocks.has(client.clientName) ? client.stockData : client.stockData.slice(0, 5)).map((stock, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                          <td className="py-1 px-2 font-medium">{stock.symbol}</td>
                                          <td className="py-1 px-2 max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" title={stock.companyName}>{stock.companyName}</td>
                                          <td className={`py-1 px-2 font-medium ${
                                            stock.totalShares > 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {stock.totalShares > 0 ? '+' : ''}{formatNumber(stock.totalShares)}
                                          </td>
                                          <td className={`py-1 px-2 font-medium ${
                                            stock.netValue > 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            ₹{(Math.abs(stock.netValue) / 10000000).toFixed(2)}Cr
                                          </td>
                                          <td className="py-1 px-2">
                                            {stock.avgBuyPrice > 0 ? `₹${stock.avgBuyPrice.toFixed(1)}` : '-'}
                                          </td>
                                          <td className="py-1 px-2">
                                            {stock.avgSellPrice > 0 ? `₹${stock.avgSellPrice.toFixed(1)}` : '-'}
                                          </td>
                                          <td className="py-1 px-2">{stock.dealCount}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">All Individual Deals</span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-300 dark:border-gray-600">
                                        <th className="text-left py-1 px-2 font-medium">Date</th>
                                        <th className="text-left py-1 px-2 font-medium">Symbol</th>
                                        <th className="text-left py-1 px-2 font-medium">Company</th>
                                        <th className="text-left py-1 px-2 font-medium">Deal Type</th>
                                        <th className="text-left py-1 px-2 font-medium">Buy/Sell</th>
                                        <th className="text-left py-1 px-2 font-medium">Qty</th>
                                        <th className="text-left py-1 px-2 font-medium">Price</th>
                                        <th className="text-left py-1 px-2 font-medium">Value</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {client.stockData.flatMap(stock => stock.deals).sort((a, b) =>
                                        new Date(b.BD_DT_DATE).getTime() - new Date(a.BD_DT_DATE).getTime()
                                      ).map((deal, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                          <td className="py-1 px-2">{deal.BD_DT_DATE}</td>
                                          <td className="py-1 px-2 font-medium">{deal.BD_SYMBOL}</td>
                                          <td className="py-1 px-2 max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" title={deal.BD_SCRIP_NAME}>
                                            {deal.BD_SCRIP_NAME}
                                          </td>
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
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="👥"
          title="No client data available"
          subtitle="Select a date range and deal type to view client analytics"
        />
      )}
    </div>
  );
}