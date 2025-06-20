"use client";

import React, { useEffect, useState } from 'react';
import { FaSyncAlt, FaChevronDown, FaChevronRight, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import Navigation from '@/app/component/Navigation';

interface DealData {
  BD_DT_DATE: string;
  BD_SYMBOL: string;
  BD_SCRIP_NAME: string;
  BD_CLIENT_NAME: string;
  BD_BUY_SELL: string;
  BD_QTY_TRD: number;
  BD_TP_WATP: number;
  BD_REMARKS: string;
}

interface AggregatedData {
  symbol: string;
  companyName: string;
  totalBought: number;
  totalSold: number;
  totalValueBought: number;
  totalValueSold: number;
  netPosition: number;
  netValue: number;
  dealCount: number;
  uniqueClients: number;
  avgDealSize: number;
  minPrice: number;
  maxPrice: number;
  marketCap: number;
  deals: DealData[];
}

type SortField = 'symbol' | 'totalValueBought' | 'totalValueSold' | 'netValue' | 'dealCount' | 'marketCap';
type SortDirection = 'asc' | 'desc';

export default function BulkDealAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AggregatedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('totalValueBought');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateFilter, setDateFilter] = useState('1W');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  const dateFilters = [
    { label: '1D', days: 1 },
    { label: '1W', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
  ];

  function getDateRange() {
    if (dateFilter === 'Custom') {
      return {
        from: customFromDate ? formatDateForAPI(customFromDate) : '',
        to: customToDate ? formatDateForAPI(customToDate) : '',
        fromDisplay: customFromDate ? formatDateForAPI(customFromDate) : '',
        toDisplay: customToDate ? formatDateForAPI(customToDate) : ''
      };
    }

    const today = new Date();
    const fromDate = new Date(today);
    const selectedFilter = dateFilters.find(f => f.label === dateFilter);
    if (selectedFilter) {
      fromDate.setDate(today.getDate() - selectedFilter.days);
    }

    return {
      from: formatDateForAPI(fromDate.toISOString().split('T')[0]),
      to: formatDateForAPI(today.toISOString().split('T')[0]),
      fromDisplay: formatDateForAPI(fromDate.toISOString().split('T')[0]),
      toDisplay: formatDateForAPI(today.toISOString().split('T')[0])
    };
  }

  function formatDateForAPI(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value);
  }

  function formatMarketCap(value: number): string {
    if (value === 0) return 'N/A';
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K Cr`;
    }
    return `₹${value.toFixed(0)} Cr`;
  }

  async function fetchAnalyticsData() {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      if (!from || !to) {
        alert('Please select valid date range');
        return;
      }

      const response = await fetch(
        `/api/fetchBulkBlockDeals?optionType=bulk_deals&from=${from}&to=${to}`
      );
      const data = await response.json();

      if (data.data) {
        const aggregated = aggregateDealsData(data.data, data.marketCapData || {});
        setAnalyticsData(aggregated);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  function aggregateDealsData(deals: DealData[], marketCapData: { [key: string]: number } = {}): AggregatedData[] {
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
      deals: item.deals.sort((a: DealData, b: DealData) => b.BD_QTY_TRD - a.BD_QTY_TRD)
    }));

    return aggregatedData;
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
    return [...analyticsData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * multiplier;
      }
      return (Number(aVal) - Number(bVal)) * multiplier;
    });
  }

  function toggleRowExpansion(symbol: string) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol);
    } else {
      newExpanded.add(symbol);
    }
    setExpandedRows(newExpanded);
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return <FaSort className="opacity-50" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  }

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateFilter]);

  const sortedData = getSortedData();
  const { fromDisplay, toDisplay } = getDateRange();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bulk Deal Analytics
            </h1>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
              📊 Data from {fromDisplay} to {toDisplay}
            </div>
          </div>
        <button
          onClick={fetchAnalyticsData}
          disabled={loading}
          className="flex items-center px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Compact Date Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">📅 Period:</span>
          {dateFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setDateFilter(filter.label)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                dateFilter === filter.label
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 hover:shadow-md'
              }`}
            >
              {filter.label}
            </button>
          ))}
          <button
            onClick={() => setDateFilter('Custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              dateFilter === 'Custom'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 hover:shadow-md'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => {
              setDateFilter('1W');
              setCustomFromDate('');
              setCustomToDate('');
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Clear
          </button>
        </div>

        {dateFilter === 'Custom' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🗓️ Custom:</span>
            <input
              type="date"
              value={customFromDate}
              onChange={(e) => setCustomFromDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={customToDate}
              onChange={(e) => setCustomToDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
            />
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="px-4 py-1.5 text-sm text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Analytics Table */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <FaSyncAlt className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      )}

      {sortedData.length > 0 ? (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              📈 Bulk Deal Analytics
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-3 bg-white dark:bg-gray-700 px-3 py-1 rounded-full">
                {sortedData.length} stocks analyzed
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('symbol')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>SYMBOL</span>
                      {getSortIcon('symbol')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    COMPANY
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('marketCap')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>MARKET CAP</span>
                      {getSortIcon('marketCap')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    QTY BOUGHT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    QTY SOLD
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('totalValueBought')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>VALUE BOUGHT</span>
                      {getSortIcon('totalValueBought')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('totalValueSold')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>VALUE SOLD</span>
                      {getSortIcon('totalValueSold')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('netValue')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>NET VALUE</span>
                      {getSortIcon('netValue')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => handleSort('dealCount')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>DEALS</span>
                      {getSortIcon('dealCount')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                    DETAILS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((row) => (
                  <React.Fragment key={row.symbol}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {row.symbol}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {row.companyName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatMarketCap(row.marketCap)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatNumber(row.totalBought)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatNumber(row.totalSold)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(row.totalValueBought)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                        {formatCurrency(row.totalValueSold)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                        row.netValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(row.netValue)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {row.dealCount} ({row.uniqueClients} clients)
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleRowExpansion(row.symbol)}
                          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {expandedRows.has(row.symbol) ? <FaChevronDown /> : <FaChevronRight />}
                          <span className="ml-1">
                            {expandedRows.has(row.symbol) ? 'Hide' : 'Show'}
                          </span>
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(row.symbol) && (
                      <tr>
                        <td colSpan={10} className="px-4 py-4 bg-gray-50 dark:bg-gray-900">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Net Position:</span>
                                <span className={`ml-2 ${row.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatNumber(row.netPosition)}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Avg Deal Size:</span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                  {formatNumber(Math.round(row.avgDealSize))}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Price Range:</span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                  ₹{row.minPrice} - ₹{row.maxPrice}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Market Cap:</span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                  {formatMarketCap(row.marketCap)}
                                </span>
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Client</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Type</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Price</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {row.deals.map((deal, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{deal.BD_DT_DATE}</td>
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{deal.BD_CLIENT_NAME}</td>
                                      <td className={`px-3 py-2 font-medium ${
                                        deal.BD_BUY_SELL === 'BUY' ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {deal.BD_BUY_SELL}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                        {formatNumber(deal.BD_QTY_TRD)}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                        ₹{deal.BD_TP_WATP}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                        {formatCurrency(deal.BD_QTY_TRD * deal.BD_TP_WATP)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loading ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600 dark:text-gray-400">No analytics data available</p>
        </div>
      ) : null}
      </div>
    </div>
  );
}