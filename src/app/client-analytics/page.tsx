"use client";

import React, { useEffect, useState } from 'react';
import { FaSyncAlt, FaChevronDown, FaChevronRight, FaSortUp, FaSortDown, FaSort, FaUser, FaBuilding } from 'react-icons/fa';
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

interface ClientStockData {
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

interface ClientAggregatedData {
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

type SortField = 'clientName' | 'totalValueBought' | 'totalValueSold' | 'netValue' | 'uniqueStocks' | 'totalDeals';
type SortDirection = 'asc' | 'desc';
type DealType = 'bulk' | 'block' | 'both';
type ExpandedViewMode = 'stocks' | 'deals';

export default function ClientAnalyticsPage() {
  const [clientData, setClientData] = useState<ClientAggregatedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('totalValueBought');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateFilter, setDateFilter] = useState('1W');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [dealType, setDealType] = useState<DealType>('both');
  const [expandedViewMode, setExpandedViewMode] = useState<Map<string, ExpandedViewMode>>(new Map());
  const [showAllStocks, setShowAllStocks] = useState<Set<string>>(new Set());

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

  async function fetchClientData() {
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
        const aggregated = aggregateClientData(allDeals);
        setClientData(aggregated);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  }

  function aggregateClientData(deals: DealData[]): ClientAggregatedData[] {
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

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  function getSortedData() {
    return [...clientData].sort((a, b) => {
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

  useEffect(() => {
    fetchClientData();
  }, [dateFilter, dealType]);

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
              <FaUser className="inline mr-2" /> Client Analytics
            </h1>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded px-2 py-1 inline-block mt-1">
              📊 {fromDisplay} to {toDisplay} • {dealType === 'both' ? 'Bulk + Block' : `${dealType.charAt(0).toUpperCase() + dealType.slice(1)} Deals`}
            </div>
          </div>
          <button
            onClick={fetchClientData}
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
                onClick={fetchClientData}
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading client analytics...</p>
        </div>
      )}

      {/* Client Analytics Table */}
      {sortedData.length > 0 ? (
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
                      <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100 max-w-[150px] truncate" title={client.clientName}>
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
                                          <td className="py-1 px-2 max-w-[120px] truncate" title={stock.companyName}>{stock.companyName}</td>
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
                                        <th className="text-left py-1 px-2 font-medium">Type</th>
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
                                          <td className="py-1 px-2 max-w-[100px] truncate" title={deal.BD_SCRIP_NAME}>
                                            {deal.BD_SCRIP_NAME}
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
        !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No client data available</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Select a date range and deal type to view client analytics</p>
          </div>
        )
      )}
    </div>
  );
}