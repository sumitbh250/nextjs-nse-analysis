"use client";

import React from 'react';
import Navigation from '@/app/component/Navigation';
import Documentation from '@/app/component/Documentation';
import { useDealPageState } from '@/lib/hooks';
import { FilterSection, PageHeader, LoadingState, EmptyState } from '@/lib/ui-components';
import { DealTable, BULK_DEALS_COLUMNS } from '@/lib/table-components';
import { getDateRange } from '@/lib/common';

export default function BigDealsPage() {
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

  const dateRange = getDateRange(dateFilter, fromDate, toDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <Documentation />

      <PageHeader
        title="NSE Bulk & Block Deals"
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
        <LoadingState message="Loading deals..." />
      ) : dealsData && dealsData.deals && dealsData.deals.length > 0 ? (
        <div className="mx-4">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              📈 {dealType === 'bulk_deals' ? 'Bulk' : dealType === 'block_deals' ? 'Block' : 'Bulk & Block'} Deals
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                {dealsData.deals.length} deals
              </span>
              {hideIntraday && intradayStats.intraday > 0 && (
                <span className="text-xs font-normal text-orange-500 dark:text-orange-400 ml-2 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded-full">
                  {intradayStats.intraday} intraday hidden
                </span>
              )}
            </h3>
          </div>
          <DealTable
            columns={BULK_DEALS_COLUMNS}
            data={dealsData.deals}
            emptyMessage="No deals data available"
            className="rounded-t-none"
          />
        </div>
      ) : (
        <EmptyState
          icon="📊"
          title="No deals data available"
          subtitle="Select deal type and date range to view data"
        />
      )}
    </div>
  );
}