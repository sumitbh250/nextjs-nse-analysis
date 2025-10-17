"use client";

import React, { useEffect } from 'react';
import { FaChevronDown, FaChevronRight, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import Navigation from '@/app/component/Navigation';
import Documentation from '@/app/component/Documentation';
import { useAnalyticsPageState, SortField } from '@/lib/hooks';
import { FilterSection, PageHeader, LoadingState, EmptyState } from '@/lib/ui-components';
import { DealTable, ANALYTICS_COLUMNS } from '@/lib/table-components';
import { getDateRange, formatNumber, formatMarketCap, formatPrice } from '@/lib/common';
import { aggregateDealsData, aggregateClientDataForSymbol, aggregateDateDataForSymbol, sortAnalyticsData } from '@/lib/analytics-utils';


export default function DealAnalyticsPage() {
  const {
    loading,
    dealsData,
    dealType,
    dateFilter,
    fromDate,
    toDate,
    hideIntraday,
    intradayStats,
    analyticsData,
    setAnalyticsData,
    expandedRows,
    sortField,
    sortDirection,
    expandedViewMode,
    showAllDeals,
    handleDealTypeChange,
    handleTimeRangeChange,
    handleIntradayToggle,
    handleDateChange,
    refreshData,
    handleSort,
    toggleRowExpansion,
    toggleShowAllDeals,
    getExpandedViewMode,
    setExpandedViewModeForSymbol
  } = useAnalyticsPageState();

  const dateRange = getDateRange(dateFilter, fromDate, toDate);

  // Process analytics data when deals data changes
  useEffect(() => {
    if (dealsData && dealsData.deals && dealsData.deals.length > 0) {
      const aggregated = aggregateDealsData(
        dealsData.deals, 
        dealsData.marketCapData, 
        dealsData.priceData, 
        {}
      );
        setAnalyticsData(aggregated);
    }
  }, [dealsData]);

  const sortedData = sortAnalyticsData(analyticsData, sortField, sortDirection);

  function getSortIcon(field: SortField) {
    if (sortField !== field) return <FaSort className="opacity-50" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <Documentation />

      <PageHeader
        title="Deal Analytics"
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
        <LoadingState message="Loading analytics..." />
      ) : sortedData.length > 0 ? (

        <div className="mx-4">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Stock Analysis Results
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                {sortedData.length} stocks
              </span>
            </h3>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-b-xl shadow-lg overflow-hidden border border-white/20 border-t-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
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
                      onClick={() => handleSort('askPrice')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>ASK</span>
                      {getSortIcon('askPrice')}
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
                      onClick={() => handleSort('dealCount')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>CNT</span>
                      {getSortIcon('dealCount')}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    INFO
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((row) => (
                  <React.Fragment key={row.symbol}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        {row.askPrice > 0 ? `₹${row.askPrice.toFixed(1)}` : 'N/A'}
                      </td>
                      <td className="px-2 py-2 text-xs text-green-600 dark:text-green-400">
                        {formatNumber(row.totalBought)}
                      </td>
                      <td className="px-2 py-2 text-xs text-red-600 dark:text-red-400">
                        {formatNumber(row.totalSold)}
                      </td>
                      <td className="px-2 py-2 text-xs text-green-600 dark:text-green-400">
                        ₹{(row.totalValueBought / 10000000).toFixed(1)}Cr
                      </td>
                      <td className="px-2 py-2 text-xs text-red-600 dark:text-red-400">
                        ₹{(row.totalValueSold / 10000000).toFixed(1)}Cr
                      </td>
                      <td className={`px-2 py-2 text-xs font-medium ${
                        row.netValue > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        ₹{(Math.abs(row.netValue) / 10000000).toFixed(1)}Cr
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        {row.dealCount}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => toggleRowExpansion(row.symbol)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {expandedRows.has(row.symbol) ?
                            <FaChevronDown size={12} /> :
                            <FaChevronRight size={12} />
                          }
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {expandedRows.has(row.symbol) && (
                      <tr>
                        <td colSpan={12} className="px-2 py-3 bg-gray-50 dark:bg-gray-800">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <span>🏢 Market Cap: <strong>{formatMarketCap(row.marketCap)}</strong></span>
                              <span>💰 Price: <strong>{formatPrice(row.price)}</strong></span>
                              <span>💰 Ask Price: <strong>{row.askPrice > 0 ? `₹${row.askPrice.toFixed(1)}` : 'N/A'}</strong></span>
                              <span>👥 Clients: <strong>{row.uniqueClients}</strong></span>
                              <span>📊 Avg Deal: <strong>{formatNumber(Math.round(row.avgDealSize))}</strong></span>
                              <span>💰 Price Range: <strong>₹{row.minPrice.toFixed(1)} - ₹{row.maxPrice.toFixed(1)}</strong></span>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">View:</span>
                              <button
                                onClick={() => setExpandedViewModeForSymbol(row.symbol, 'deals')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                                  getExpandedViewMode(row.symbol) === 'deals'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                }`}
                              >
                                📋 Individual Deals
                              </button>
                              <button
                                onClick={() => setExpandedViewModeForSymbol(row.symbol, 'clients')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                                  getExpandedViewMode(row.symbol) === 'clients'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                }`}
                              >
                                👥 Client Aggregated
                              </button>
                              <button
                                onClick={() => setExpandedViewModeForSymbol(row.symbol, 'dates')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                                  getExpandedViewMode(row.symbol) === 'dates'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                }`}
                              >
                                📅 Date Aggregated
                              </button>
                            </div>

                            {getExpandedViewMode(row.symbol) === 'deals' ? (
                              <>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Individual Deals</span>
                                  {row.deals.length > 5 && (
                                    <button
                                      onClick={() => toggleShowAllDeals(row.symbol)}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      {showAllDeals.has(row.symbol) ? 'Show Less' : `Show All ${row.deals.length} Deals`}
                                    </button>
                                  )}
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-300 dark:border-gray-600">
                                        <th className="text-left py-1 px-2 font-medium">Date</th>
                                        <th className="text-left py-1 px-2 font-medium">Client</th>
                                        <th className="text-left py-1 px-2 font-medium">Deal Type</th>
                                        <th className="text-left py-1 px-2 font-medium">Buy/Sell</th>
                                        <th className="text-left py-1 px-2 font-medium">Qty</th>
                                        <th className="text-left py-1 px-2 font-medium">Price</th>
                                        <th className="text-left py-1 px-2 font-medium">Value</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(showAllDeals.has(row.symbol) ? row.deals : row.deals.slice(0, 5)).map((deal, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                          <td className="py-1 px-2">{deal.BD_DT_DATE}</td>
                                          <td className="py-1 px-2 max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" title={deal.BD_CLIENT_NAME}>
                                            {deal.BD_CLIENT_NAME}
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
                            ) : getExpandedViewMode(row.symbol) === 'clients' ? (
                              <>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Client Aggregated Data</span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-300 dark:border-gray-600">
                                        <th className="text-left py-1 px-2 font-medium">Client</th>
                                        <th className="text-left py-1 px-2 font-medium">Net Qty</th>
                                        <th className="text-left py-1 px-2 font-medium">Total Value</th>
                                        <th className="text-left py-1 px-2 font-medium">Avg Price</th>
                                        <th className="text-left py-1 px-2 font-medium">Deals</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {aggregateClientDataForSymbol(row.deals, row.symbol).map((clientData, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                          <td className="py-1 px-2 max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[350px] truncate" title={clientData.clientName}>
                                            {clientData.clientName}
                                          </td>
                                          <td className={`py-1 px-2 font-medium ${
                                            clientData.totalShares > 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {clientData.totalShares > 0 ? '+' : ''}{formatNumber(clientData.totalShares)}
                                          </td>
                                          <td className="py-1 px-2 text-blue-600 font-medium">
                                            ₹{(clientData.totalValue / 10000000).toFixed(2)}Cr
                                          </td>
                                          <td className="py-1 px-2">
                                            ₹{clientData.avgPrice.toFixed(1)}
                                          </td>
                                          <td className="py-1 px-2">
                                            {clientData.dealCount}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Date Aggregated Data</span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-300 dark:border-gray-600">
                                        <th className="text-left py-1 px-2 font-medium">Date</th>
                                        <th className="text-left py-1 px-2 font-medium">Qty Bought</th>
                                        <th className="text-left py-1 px-2 font-medium">Qty Sold</th>
                                        <th className="text-left py-1 px-2 font-medium">Net Qty</th>
                                        <th className="text-left py-1 px-2 font-medium">Value Bought</th>
                                        <th className="text-left py-1 px-2 font-medium">Value Sold</th>
                                        <th className="text-left py-1 px-2 font-medium">Net Value</th>
                                        <th className="text-left py-1 px-2 font-medium">Deals</th>
                                        <th className="text-left py-1 px-2 font-medium">Clients</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {aggregateDateDataForSymbol(row.deals, row.symbol).map((dateData, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                          <td className="py-1 px-2">{dateData.date}</td>
                                          <td className="py-1 px-2 text-green-600">
                                            {formatNumber(dateData.totalBought)}
                                          </td>
                                          <td className="py-1 px-2 text-red-600">
                                            {formatNumber(dateData.totalSold)}
                                          </td>
                                          <td className={`py-1 px-2 font-medium ${
                                            dateData.netPosition > 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {dateData.netPosition > 0 ? '+' : ''}{formatNumber(dateData.netPosition)}
                                          </td>
                                          <td className="py-1 px-2 text-green-600">
                                            ₹{(dateData.totalValueBought / 10000000).toFixed(2)}Cr
                                          </td>
                                          <td className="py-1 px-2 text-red-600">
                                            ₹{(dateData.totalValueSold / 10000000).toFixed(2)}Cr
                                          </td>
                                          <td className={`py-1 px-2 font-medium ${
                                            dateData.netValue > 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            ₹{(Math.abs(dateData.netValue) / 10000000).toFixed(2)}Cr
                                          </td>
                                          <td className="py-1 px-2">
                                            {dateData.dealCount}
                                          </td>
                                          <td className="py-1 px-2">
                                            {dateData.uniqueClients}
                                          </td>
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
        </div>
      ) : (
        <EmptyState
          icon="📊"
          title="No analytics data available"
          subtitle="Select a date range and click refresh to view data"
        />
      )}
    </div>
  );
}
