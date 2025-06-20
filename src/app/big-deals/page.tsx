"use client";

import { useEffect, useState } from 'react';
import { FaSyncAlt } from 'react-icons/fa';
import SimpleTable from '@/app/component/SimpleTable';
import Modal from '@/app/component/Modal';
import Navigation from '@/app/component/Navigation';

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
  const [selectedRange, setSelectedRange] = useState('1W');

  // Set default dates (last 7 days)
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    setToDate(formatDateForInput(today));
    setFromDate(formatDateForInput(lastWeek));
  }, []);

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
    setSelectedRange(range);
    const today = new Date();
    let startDate = new Date();

    switch (range) {
      case '1D':
        startDate = new Date(today);
        break;
      case '1W':
        startDate.setDate(today.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'Clear':
        setFromDate('');
        setToDate('');
        return;
      default:
        return;
    }

    setFromDate(formatDateForInput(startDate));
    setToDate(formatDateForInput(today));
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

  return (
    <div>
      <Navigation />
      <div className="p-6">
        {showModal && <Modal />}

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              Bulk & Block Deals
            </h1>
            {fromDate && toDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getDateRangeText()}
              </p>
            )}
          </div>
          <button
            onClick={refreshButton}
            disabled={loading}
            className="flex items-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors"
          >
            <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Compact Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Time Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
            {['1D', '1W', '1M', '3M', '6M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {range}
              </button>
            ))}
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSelectedRange('');
              }}
              className="px-2 py-1 text-xs rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Deal Type */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
            <select
              value={optionType}
              onChange={(e) => setOptionType(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="bulk_deals">Bulk Deals</option>
              <option value="block_deals">Block Deals</option>
            </select>
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setSelectedRange('Custom');
              }}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setSelectedRange('Custom');
              }}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Fetch Button */}
          <button
            onClick={fetchDealsData}
            disabled={loading}
            className="px-4 py-1 text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded transition-colors"
          >
            {loading ? 'Fetching...' : 'Fetch Data'}
          </button>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading deals data...</p>
          </div>
        )}

        {dealsData && dealsData.data && dealsData.data.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {optionType === 'bulk_deals' ? 'Bulk Deals' : 'Block Deals'}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({dealsData.data.length} records)
                </span>
              </h3>
            </div>
            <SimpleTable columns={bulk_deals_columns} data={dealsData.data} />
          </div>
        ) : dealsData && dealsData.data && dealsData.data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No deals found for the selected criteria.
            </p>
          </div>
        ) : dealsData && !loading ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 dark:text-gray-400">No data available</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}