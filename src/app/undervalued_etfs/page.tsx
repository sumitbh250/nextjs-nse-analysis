"use client";

import { useEffect, useState } from 'react';
import { FaSyncAlt, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import Navigation from '@/app/component/Navigation';
import Documentation from '@/app/component/Documentation';

type SortKey = 'symbol' | 'ltp' | 'inav' | 'percentage' | 'volume' | 'value';
type SortOrder = 'asc' | 'desc';

export default function UndervaluedEtfsPage() {
  const etf_data_columns = [
    { key: "symbol", label: "SYMBOL" },
    { key: "assets", label: "UNDERLYING ASSET" },
    { key: "companyName", label: "COMPANY NAME" },
    { key: "undervalued_pct", label: "UNDERVALUED PCT" },
    { key: "ltP", label: "LTP" },
    { key: "inav", label: "INAV" },
    { key: "nav", label: "NAV" },
    { key: "qty", label: "QUANTITY" },
    { key: "open", label: "OPEN" },
    { key: "high", label: "HIGH" },
    { key: "low", label: "LOW" },
  ];

  const [etfData, setEtfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('percentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  async function fetchEtfData() {
    try {
      const response = await fetch('/api/fetchETF');
      const data = await response.json();
      console.log('ETF data:', data);
      setEtfData(data);
    } catch (error) {
      console.error('Error fetching ETF data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEtfData();
  }, []);

  function refreshButton() {
    setEtfData(null);
    setLoading(true);
    setShowModal(false);
    fetchEtfData();
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <FaSort className="w-3 h-3 text-gray-400" />;
    }
    return sortOrder === 'asc'
      ? <FaSortUp className="w-3 h-3 text-blue-600" />
      : <FaSortDown className="w-3 h-3 text-blue-600" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(1)}Cr`;
    } else if (num >= 100000) {
      return `${(num / 100000).toFixed(1)}L`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const sortedEtfData = etfData?.data ? [...etfData.data].sort((a: any, b: any) => {
    let aValue, bValue;

    switch (sortKey) {
      case 'symbol':
        aValue = a.symbol || '';
        bValue = b.symbol || '';
        break;
      case 'ltp':
        aValue = Number(a.ltP) || 0;
        bValue = Number(b.ltP) || 0;
        break;
      case 'inav':
        aValue = Number(a.inav) || 0;
        bValue = Number(b.inav) || 0;
        break;
      case 'percentage':
        aValue = parseFloat(a.undervalued_pct) || 0;
        bValue = parseFloat(b.undervalued_pct) || 0;
        break;
      case 'volume':
        aValue = Number(a.qty) || 0;
        bValue = Number(b.qty) || 0;
        break;
      case 'value':
        aValue = (Number(a.ltP) * Number(a.qty)) || 0;
        bValue = (Number(b.ltP) * Number(b.qty)) || 0;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  }) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <Navigation />
        <Documentation />

        {/* Compact Header */}
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📈 Undervalued ETFs
              </h1>
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded px-2 py-1 inline-block mt-1">
                🔍 Market Price vs iNAV Analysis
              </div>
            </div>
            <button
              onClick={refreshButton}
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} size={12} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mb-3">
            <FaSyncAlt className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading ETF data...</p>
        </div>

        {/* Compact ETF Table */}
        {etfData && etfData.data ? (
          <div className="mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📊 ETF Analysis Results
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                  {etfData.data.length} ETFs
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    {[
                      { key: 'symbol', label: 'SYM', sortable: true },
                      { key: 'name', label: 'NAME', sortable: false },
                      { key: 'ltp', label: 'LTP', sortable: true },
                      { key: 'inav', label: 'iNAV', sortable: true },
                      { key: 'percentage', label: 'DIFF%', sortable: true },
                      { key: 'volume', label: 'VOL', sortable: true },
                      { key: 'value', label: 'VAL', sortable: true }
                    ].map((column) => (
                      <th key={column.key} className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {column.sortable ? (
                          <button
                            onClick={() => handleSort(column.key as SortKey)}
                            className="flex items-center space-x-1 hover:text-blue-600"
                          >
                            <span>{column.label}</span>
                            {getSortIcon(column.key as SortKey)}
                          </button>
                        ) : (
                          <span>{column.label}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedEtfData.map((etf, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100" title={etf.symbol}>
                        <div className="max-w-[60px] truncate">
                          {etf.symbol}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300" title={etf.companyName}>
                        <div className="max-w-[120px] truncate">
                          {etf.companyName}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        ₹{(Number(etf.ltP) || 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        ₹{(Number(etf.inav) || 0).toFixed(2)}
                      </td>
                      <td className={`px-2 py-2 text-xs font-medium ${
                        parseFloat(etf.undervalued_pct || '0') > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {etf.undervalued_pct || '0.00'}%
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        {formatNumber(Number(etf.qty) || 0)}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                        ₹{(((Number(etf.ltP) || 0) * (Number(etf.qty) || 0)) / 10000000).toFixed(1)}Cr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No ETF data available</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Click refresh to load ETF data</p>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <Documentation />

      {/* Compact Header */}
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              📈 Undervalued ETFs
            </h1>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded px-2 py-1 inline-block mt-1">
              🔍 Market Price vs iNAV Analysis
            </div>
          </div>
          <button
            onClick={refreshButton}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} size={12} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mb-3">
            <FaSyncAlt className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading ETF data...</p>
        </div>
      )}

      {/* Compact ETF Table */}
      {etfData && etfData.data ? (
        <div className="mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              📊 ETF Analysis Results
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                {etfData.data.length} ETFs
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  {[
                    { key: 'symbol', label: 'SYM', sortable: true },
                    { key: 'name', label: 'NAME', sortable: false },
                    { key: 'ltp', label: 'LTP', sortable: true },
                    { key: 'inav', label: 'iNAV', sortable: true },
                    { key: 'percentage', label: 'DIFF%', sortable: true },
                    { key: 'volume', label: 'VOL', sortable: true },
                    { key: 'value', label: 'VAL', sortable: true }
                  ].map((column) => (
                    <th key={column.key} className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {column.sortable ? (
                        <button
                          onClick={() => handleSort(column.key as SortKey)}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>{column.label}</span>
                          {getSortIcon(column.key as SortKey)}
                        </button>
                      ) : (
                        <span>{column.label}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedEtfData.map((etf, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100" title={etf.symbol}>
                      <div className="max-w-[60px] truncate">
                        {etf.symbol}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300" title={etf.companyName}>
                      <div className="max-w-[120px] truncate">
                        {etf.companyName}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                      ₹{(Number(etf.ltP) || 0).toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                      ₹{(Number(etf.inav) || 0).toFixed(2)}
                    </td>
                                            <td className={`px-2 py-2 text-xs font-medium ${
                          parseFloat(etf.undervalued_pct || '0') > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                      {etf.undervalued_pct || '0.00'}%
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                      {formatNumber(Number(etf.qty) || 0)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                      ₹{(((Number(etf.ltP) || 0) * (Number(etf.qty) || 0)) / 10000000).toFixed(1)}Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No ETF data available</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Click refresh to load ETF data</p>
          </div>
        )
      )}
    </div>
  );
}