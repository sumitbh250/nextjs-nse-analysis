"use client";

import React, { useEffect, useState } from 'react';
import { FaSyncAlt } from 'react-icons/fa';
import Navigation from '@/app/component/Navigation';
import Documentation from '@/app/component/Documentation';
import SimpleTable from '@/app/component/SimpleTable';

export default function BigDealsPage() {
  const bulk_deals_columns = [
    { key: "BD_DT_DATE", label: "DATE" },
    { key: "BD_SYMBOL", label: "SYMBOL" },
    { key: "BD_SCRIP_NAME", label: "COMPANY NAME" },
    { key: "BD_CLIENT_NAME", label: "CLIENT NAME" },
    { key: "BD_BUY_SELL", label: "BUY/SELL" },
    { key: "BD_QTY_TRD", label: "QUANTITY" },
    { key: "BD_TP_WATP", label: "PRICE" },
    { key: "BD_REMARKS", label: "REMARKS" },
  ];

  const [dealsData, setDealsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [optionType, setOptionType] = useState('bulk_deals');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilter, setDateFilter] = useState('1W');

  // Set default dates (last 7 days) and fetch initial data
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    setToDate(formatDateForInput(today));
    setFromDate(formatDateForInput(lastWeek));
  }, []);

  // Auto-fetch data when filters change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchDealsData();
    }
  }, [optionType, fromDate, toDate]);

  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function formatDateForAPI(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function handleTimeRangeChange(range: string) {
    setDateFilter(range);

    if (range === 'Custom') {
      return; // Let user set custom dates
    }

    if (range === 'Clear') {
      setDateFilter('1W');
      range = '1W'; // Reset to 1W after clear
    }

    const today = new Date();
    const selectedFilter = dateFilters.find(f => f.label === range);

    if (selectedFilter) {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - selectedFilter.days);

      setFromDate(formatDateForInput(startDate));
      setToDate(formatDateForInput(today));
    }
  }

  async function fetchDealsData() {
    if (!fromDate || !toDate) {
      alert('Please select both from and to dates');
      return;
    }

    setLoading(true);
    try {
      const fromFormatted = formatDateForAPI(fromDate);
      const toFormatted = formatDateForAPI(toDate);

      const response = await fetch(
        `/api/fetchBulkBlockDeals?optionType=${optionType}&from=${fromFormatted}&to=${toFormatted}`
      );
      const data = await response.json();
      console.log('Bulk/Block deals data:', data);
      setDealsData(data);
    } catch (error) {
      console.error('Error fetching deals data:', error);
    } finally {
      setLoading(false);
    }
  }

  function refreshButton() {
    setDealsData(null);
    setShowModal(false);
    fetchDealsData();
  }

  const getDateRangeText = () => {
    if (!fromDate || !toDate) return '';
    return `Data from ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`;
  };

  const dateFilters = [
    { label: '1D', days: 1 },
    { label: '1W', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
  ];

  const fromDisplay = formatDateForDisplay(fromDate);
  const toDisplay = formatDateForDisplay(toDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <Documentation />

      {/* Compact Header */}
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              NSE Bulk & Block Deals
            </h1>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded px-2 py-1 inline-block mt-1">
              📊 {fromDisplay} to {toDisplay}
            </div>
          </div>
          <button
            onClick={fetchDealsData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} size={12} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Ultra Compact Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">📊</span>
          <select
            value={optionType}
            onChange={(e) => setOptionType(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="bulk_deals">Bulk Deals</option>
            <option value="block_deals">Block Deals</option>
          </select>

          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">📅</span>
          {dateFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleTimeRangeChange(filter.label)}
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
            onClick={() => handleTimeRangeChange('Custom')}
            className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
              dateFilter === 'Custom'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => handleTimeRangeChange('Clear')}
            className="px-2 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-sm"
          >
            Clear
          </button>

          {dateFilter === 'Custom' && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={fetchDealsData}
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading deals...</p>
        </div>
      )}

             {/* Compact Table Section */}
       {dealsData && dealsData.data && dealsData.data.length > 0 ? (
         <div className="mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20">
           <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
             <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
               📈 {optionType === 'bulk_deals' ? 'Bulk' : 'Block'} Deals
               <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                 {dealsData.data.length} deals
               </span>
             </h3>
           </div>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
               <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                 <tr>
                   {bulk_deals_columns.map((column) => (
                     <th
                       key={column.key}
                       className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100"
                     >
                       {column.label}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {dealsData.data.map((row: any, rowIndex: number) => (
                   <tr
                     key={rowIndex}
                     className="hover:bg-gray-50 dark:hover:bg-gray-700"
                   >
                     {bulk_deals_columns.map((column) => (
                       <td
                         key={column.key}
                         className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300"
                         title={typeof row[column.key] === 'string' && row[column.key].length > 20 ? row[column.key] : undefined}
                       >
                         <div className="max-w-[120px] truncate">
                           {row[column.key]}
                         </div>
                       </td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       ) : (
         !loading && (
           <div className="text-center py-12">
             <div className="text-6xl mb-4">📊</div>
             <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No deals data available</p>
             <p className="text-sm text-gray-500 dark:text-gray-500">Select deal type and date range to view data</p>
           </div>
         )
       )}
    </div>
  );
}