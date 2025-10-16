"use client";

import React, { useEffect, useState } from 'react';
import { FaSyncAlt, FaChevronDown, FaChevronRight, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import Navigation from '@/app/component/Navigation';
import Documentation from '@/app/component/Documentation';

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
  askPrice: number;
  deals: DealData[];
}

interface ClientAggregatedData {
  clientName: string;
  symbol: string;
  companyName: string;
  totalShares: number; // bought - sold
  totalValue: number; // sum of all deal values
  dealCount: number;
  avgPrice: number;
  deals: DealData[];
}

type SortField = 'symbol' | 'totalValueBought' | 'totalValueSold' | 'netValue' | 'dealCount' | 'marketCap' | 'askPrice';
type SortDirection = 'asc' | 'desc';
type ExpandedViewMode = 'deals' | 'clients';

export default function BlockDealAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AggregatedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('totalValueBought');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateFilter, setDateFilter] = useState('1W');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [expandedViewMode, setExpandedViewMode] = useState<Map<string, ExpandedViewMode>>(new Map());
  const [showAllDeals, setShowAllDeals] = useState<Set<string>>(new Set());

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
    if (!value || value === 0) return 'Not found';
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
        `/api/fetchBulkBlockDeals?optionType=block_deals&from=${from}&to=${to}`
      );
      const data = await response.json();

      if (data.data) {
        const aggregated = await aggregateDealsData(data.data, data.marketCapData || {}, data.askPriceData || {});
        setAnalyticsData(aggregated);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function aggregateDealsData(deals: DealData[], marketCapData: { [key: string]: number } = {}, askPriceData: { [key: string]: number } = {}): Promise<AggregatedData[]> {
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
      askPrice: askPriceData[item.symbol] || 0,
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

  function getExpandedViewMode(symbol: string): ExpandedViewMode {
    return expandedViewMode.get(symbol) || 'deals';
  }

  function setExpandedViewModeForSymbol(symbol: string, mode: ExpandedViewMode) {
    const newExpandedViewMode = new Map(expandedViewMode);
    newExpandedViewMode.set(symbol, mode);
    setExpandedViewMode(newExpandedViewMode);
  }

  function aggregateClientDataForSymbol(deals: DealData[], symbol: string): ClientAggregatedData[] {
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
      <Documentation />

      {/* Compact Header */}
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Block Deal Analytics
            </h1>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded px-2 py-1 inline-block mt-1">
              📊 {fromDisplay} to {toDisplay}
            </div>
          </div>
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} size={12} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Ultra Compact Date Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">📅</span>
          {dateFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setDateFilter(filter.label)}
              className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                dateFilter === filter.label
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
          <button
            onClick={() => setDateFilter('Custom')}
            className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
              dateFilter === 'Custom'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
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
            className="px-2 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-sm"
          >
            Clear
          </button>

          {dateFilter === 'Custom' && (
            <>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="px-3 py-1 text-xs text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400 rounded transition-all duration-200 shadow-sm"
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mb-3">
            <FaSyncAlt className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      )}

      {/* Compact Analytics Table */}
      {sortedData.length > 0 ? (
        <div className="mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Stock Analysis Results
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                {sortedData.length} stocks
              </span>
            </h3>
          </div>

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
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 max-w-[120px]">
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
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 max-w-[120px] truncate" title={row.companyName}>
                        {row.companyName}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        {formatMarketCap(row.marketCap)}
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
                        <td colSpan={11} className="px-2 py-3 bg-gray-50 dark:bg-gray-800">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <span>🏢 Market Cap: <strong>{formatMarketCap(row.marketCap)}</strong></span>
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
                                        <th className="text-left py-1 px-2 font-medium">Type</th>
                                        <th className="text-left py-1 px-2 font-medium">Qty</th>
                                        <th className="text-left py-1 px-2 font-medium">Price</th>
                                        <th className="text-left py-1 px-2 font-medium">Value</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(showAllDeals.has(row.symbol) ? row.deals : row.deals.slice(0, 5)).map((deal, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                          <td className="py-1 px-2">{deal.BD_DT_DATE}</td>
                                          <td className="py-1 px-2 max-w-[100px] truncate" title={deal.BD_CLIENT_NAME}>
                                            {deal.BD_CLIENT_NAME}
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
                            ) : (
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
                                          <td className="py-1 px-2 max-w-[150px] truncate" title={clientData.clientName}>
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
        !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No analytics data available</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Select a date range and click refresh to view data</p>
          </div>
        )
      )}
    </div>
  );
}