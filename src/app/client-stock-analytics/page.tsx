"use client";

import React, { useEffect, useState } from 'react';
import { FaSyncAlt, FaChevronDown, FaChevronRight, FaSortUp, FaSortDown, FaSort, FaUser, FaBuilding, FaSearch } from 'react-icons/fa';
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
  deals: DealData[];
}

type SortField = 'clientName' | 'symbol' | 'companyName' | 'totalShares' | 'netValue' | 'totalValueBought' | 'totalValueSold' | 'dealCount' | 'avgBuyPrice' | 'avgSellPrice';
type SortDirection = 'asc' | 'desc';
type DealType = 'bulk' | 'block' | 'both';

export default function ClientStockAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<ClientStockAnalyticsData[]>([]);
  const [filteredData, setFilteredData] = useState<ClientStockAnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('netValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateFilter, setDateFilter] = useState('1W');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [dealType, setDealType] = useState<DealType>('both');
  const [clientFilter, setClientFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
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

  function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value);
  }

  async function fetchClientStockData() {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      if (!from || !to) {
        alert('Please select valid date range');
        return;
      }

      let allDeals: DealData[] = [];

      // Fetch based on deal type selection
      if (dealType === 'both') {
        const [bulkResponse, blockResponse] = await Promise.all([
          fetch(`/api/fetchBulkBlockDeals?optionType=bulk_deals&from=${from}&to=${to}`),
          fetch(`/api/fetchBulkBlockDeals?optionType=block_deals&from=${from}&to=${to}`)
        ]);

        const bulkData = await bulkResponse.json();
        const blockData = await blockResponse.json();

        allDeals = [...(bulkData.data || []), ...(blockData.data || [])];
      } else {
        const response = await fetch(
          `/api/fetchBulkBlockDeals?optionType=${dealType}_deals&from=${from}&to=${to}`
        );
        const data = await response.json();
        allDeals = data.data || [];
      }

      if (allDeals.length > 0) {
        const aggregated = aggregateClientStockData(allDeals);
        setAnalyticsData(aggregated);
        setFilteredData(aggregated);
      } else {
        setAnalyticsData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching client-stock data:', error);
    } finally {
      setLoading(false);
    }
  }

  function aggregateClientStockData(deals: DealData[]): ClientStockAnalyticsData[] {
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
    return [...filteredData].sort((a, b) => {
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

  function getSortIcon(field: SortField) {
    if (sortField !== field) return <FaSort className="opacity-50" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  }

  useEffect(() => {
    fetchClientStockData();
  }, [dateFilter, dealType]);

  useEffect(() => {
    applyFilters();
  }, [clientFilter, stockFilter, analyticsData]);

  const sortedData = getSortedData();
  const { fromDisplay, toDisplay } = getDateRange();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <Documentation />

      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <FaUser className="inline mr-2" /><FaBuilding className="inline mr-2" /> Client-Stock Analytics
            </h1>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded px-2 py-1 inline-block mt-1">
              📊 {fromDisplay} to {toDisplay} • {dealType === 'both' ? 'Bulk + Block' : `${dealType.charAt(0).toUpperCase() + dealType.slice(1)} Deals`}
            </div>
          </div>
          <button
            onClick={fetchClientStockData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} size={12} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Deal Type Filter */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">📋 Deal Type:</span>
          {(['bulk', 'block', 'both'] as DealType[]).map((type) => (
            <button
              key={type}
              onClick={() => setDealType(type)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                dealType === type
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {type === 'both' ? '🔄 Both' : type === 'bulk' ? '📦 Bulk' : '🏗️ Block'}
            </button>
          ))}
        </div>

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

        {/* Date Filters */}
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
                onClick={fetchClientStockData}
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading client-stock analytics...</p>
        </div>
      )}

      {/* Client-Stock Analytics Table */}
      {sortedData.length > 0 ? (
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
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 max-w-[120px]">
                    COMPANY
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
                        <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100 max-w-[120px] truncate" title={row.clientName}>
                          <FaUser className="inline mr-1" size={10} />
                          {row.clientName}
                        </td>
                        <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                          {row.symbol}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 max-w-[120px] truncate" title={row.companyName}>
                          {row.companyName}
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
                                      <th className="text-left py-1 px-2 font-medium">Type</th>
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
                                        <td className={`py-1 px-2 font-medium ${
                                          deal.BD_BUY_SELL === 'BUY' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {deal.BD_BUY_SELL}
                                        </td>
                                        <td className="py-1 px-2">{formatNumber(deal.BD_QTY_TRD)}</td>
                                        <td className="py-1 px-2">₹{deal.BD_TP_WATP.toFixed(1)}</td>
                                        <td className="py-1 px-2">₹{((deal.BD_QTY_TRD * deal.BD_TP_WATP) / 10000000).toFixed(2)}Cr</td>
                                        <td className="py-1 px-2 max-w-[100px] truncate" title={deal.BD_REMARKS}>
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
        !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥🏢</div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No client-stock data available</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {analyticsData.length === 0 ?
                'Select a date range and deal type to view analytics' :
                'No results match your current filters'
              }
            </p>
          </div>
        )
      )}
    </div>
  );
}