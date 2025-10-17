// Common UI components for deal-related pages

import React from 'react';
import { FaSyncAlt } from 'react-icons/fa';
import { DATE_FILTERS, DEAL_TYPE_OPTIONS, DateRange } from './common';

interface FilterSectionProps {
  dealType: string;
  onDealTypeChange: (type: string) => void;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
  onCustomDateChange: (type: 'from' | 'to', value: string) => void;
  fromDate: string;
  toDate: string;
  hideIntraday?: boolean;
  onIntradayToggle?: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function FilterSection({
  dealType,
  onDealTypeChange,
  dateFilter,
  onDateFilterChange,
  fromDate,
  toDate,
  onCustomDateChange,
  hideIntraday = false,
  onIntradayToggle,
  onRefresh,
  loading
}: FilterSectionProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">📊</span>
      <select
        value={dealType}
        onChange={(e) => onDealTypeChange(e.target.value)}
        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      >
        {DEAL_TYPE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {onIntradayToggle && (
        <>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">🚫</span>
          <label className="flex items-center space-x-1 text-xs text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={hideIntraday}
              onChange={onIntradayToggle}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span>Hide Intraday</span>
          </label>
        </>
      )}

      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">📅</span>
      {DATE_FILTERS.map((filter) => (
        <button
          key={filter.label}
          onClick={() => onDateFilterChange(filter.label)}
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
        onClick={() => onDateFilterChange('Custom')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
          dateFilter === 'Custom'
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
        }`}
      >
        Custom
      </button>
      
      <button
        onClick={() => onDateFilterChange('Clear')}
        className="px-2 py-1 text-xs font-medium rounded transition-all duration-200 bg-red-500 text-white hover:bg-red-600 shadow-sm"
      >
        Clear
      </button>

      {dateFilter === 'Custom' && (
        <>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onCustomDateChange('from', e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onCustomDateChange('to', e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1 text-xs text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400 rounded transition-all duration-200 shadow-sm"
          >
            Apply
          </button>
        </>
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  dateRange: DateRange;
  onRefresh: () => void;
  loading: boolean;
  intradayStats?: { intraday: number };
  hideIntraday?: boolean;
}

export function PageHeader({
  title,
  dateRange,
  onRefresh,
  loading,
  intradayStats,
  hideIntraday = false
}: PageHeaderProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded px-2 py-1 inline-block mt-1">
            📊 {dateRange.fromDisplay} to {dateRange.toDisplay}
            {hideIntraday && intradayStats && intradayStats.intraday > 0 && (
              <span className="ml-2 text-orange-500 dark:text-orange-400">
                • {intradayStats.intraday} intraday hidden
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} size={12} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mb-3">
        <FaSyncAlt className="w-6 h-6 text-white animate-spin" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon = '📊', title, subtitle }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-500">{subtitle}</p>
    </div>
  );
}
