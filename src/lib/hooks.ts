// Custom hooks for deal-related pages

import { useState, useEffect } from 'react';
import { getStoredSettings, saveSettings } from './settings';
import { formatDateForInput, handleTimeRangeChange, ERROR_MESSAGES, DealData } from './common';
import { fetchDealsData, FetchDealsResult } from './data-fetching';

export interface DealPageState {
  loading: boolean;
  dealsData: FetchDealsResult | null;
  dealType: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  hideIntraday: boolean;
  intradayStats: { total: number; intraday: number; filtered: number };
}

export interface DealPageActions {
  setDealType: (type: string) => void;
  setDateFilter: (filter: string) => void;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  setHideIntraday: (hide: boolean) => void;
  handleTimeRangeChange: (range: string) => void;
  handleDealTypeChange: (type: string) => void;
  handleIntradayToggle: () => void;
  handleDateChange: (type: 'from' | 'to', value: string) => void;
  fetchData: () => Promise<void>;
  refreshData: () => void;
}

/**
 * Custom hook for managing deal page state and actions
 */
export function useDealPageState(): DealPageState & DealPageActions {
  const [loading, setLoading] = useState(false);
  const [dealsData, setDealsData] = useState<FetchDealsResult | null>(null);
  const [dealType, setDealType] = useState('both');
  const [dateFilter, setDateFilter] = useState('1W');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [hideIntraday, setHideIntraday] = useState(true);
  const [intradayStats, setIntradayStats] = useState({ total: 0, intraday: 0, filtered: 0 });

  // Load settings and set default dates
  useEffect(() => {
    const settings = getStoredSettings();
    setDealType(settings.dealType);
    setDateFilter(settings.dateFilter);
    setHideIntraday(settings.hideIntraday);
    
    if (settings.fromDate && settings.toDate) {
      setFromDate(settings.fromDate);
      setToDate(settings.toDate);
    } else {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      setToDate(formatDateForInput(today));
      setFromDate(formatDateForInput(lastWeek));
    }
  }, []);

  // Auto-fetch data when filters change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchData();
    }
  }, [dealType, fromDate, toDate, hideIntraday]);

  const handleTimeRangeChangeWrapper = (range: string) => {
    const result = handleTimeRangeChange(range, dateFilter);
    setDateFilter(result.newDateFilter);
    saveSettings({ dateFilter: result.newDateFilter });

    if (result.fromDate && result.toDate) {
      setFromDate(result.fromDate);
      setToDate(result.toDate);
      saveSettings({ fromDate: result.fromDate, toDate: result.toDate });
    }
  };

  const handleDealTypeChange = (type: string) => {
    setDealType(type);
    saveSettings({ dealType: type });
  };

  const handleIntradayToggle = () => {
    const newValue = !hideIntraday;
    setHideIntraday(newValue);
    saveSettings({ hideIntraday: newValue });
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setFromDate(value);
      saveSettings({ fromDate: value });
    } else {
      setToDate(value);
      saveSettings({ toDate: value });
    }
  };

  const fetchData = async () => {
    if (!fromDate || !toDate) {
      alert(ERROR_MESSAGES.MISSING_DATES);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchDealsData(dealType, fromDate, toDate, hideIntraday);
      setDealsData(result);
      setIntradayStats(result.intradayStats);
    } catch (error) {
      console.error('Error fetching deals data:', error);
      alert(error instanceof Error ? error.message : ERROR_MESSAGES.API_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setDealsData(null);
    fetchData();
  };

  return {
    // State
    loading,
    dealsData,
    dealType,
    dateFilter,
    fromDate,
    toDate,
    hideIntraday,
    intradayStats,
    // Actions
    setDealType,
    setDateFilter,
    setFromDate,
    setToDate,
    setHideIntraday,
    handleTimeRangeChange: handleTimeRangeChangeWrapper,
    handleDealTypeChange,
    handleIntradayToggle,
    handleDateChange,
    fetchData,
    refreshData
  };
}

// Analytics-specific interfaces
export interface AggregatedData {
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
  price: number;
  askPrice: number;
  deals: DealData[];
}

export interface ClientAggregatedData {
  clientName: string;
  symbol: string;
  companyName: string;
  totalShares: number;
  totalValue: number;
  dealCount: number;
  avgPrice: number;
  deals: DealData[];
}

export interface DateAggregatedData {
  date: string;
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
  deals: DealData[];
}

export type SortField = 'symbol' | 'totalValueBought' | 'totalValueSold' | 'netValue' | 'dealCount' | 'marketCap' | 'price' | 'askPrice';
export type SortDirection = 'asc' | 'desc';
export type ExpandedViewMode = 'deals' | 'clients' | 'dates';

/**
 * Custom hook for analytics page with additional sorting and expansion state
 */
export function useAnalyticsPageState() {
  const baseState = useDealPageState();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('totalValueBought');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedViewMode, setExpandedViewMode] = useState<Map<string, ExpandedViewMode>>(new Map());
  const [showAllDeals, setShowAllDeals] = useState<Set<string>>(new Set());
  const [analyticsData, setAnalyticsData] = useState<AggregatedData[]>([]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRowExpansion = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const toggleShowAllDeals = (key: string) => {
    const newShowAll = new Set(showAllDeals);
    if (newShowAll.has(key)) {
      newShowAll.delete(key);
    } else {
      newShowAll.add(key);
    }
    setShowAllDeals(newShowAll);
  };

  const getExpandedViewMode = (symbol: string): ExpandedViewMode => {
    return expandedViewMode.get(symbol) || 'deals';
  };

  const setExpandedViewModeForSymbol = (symbol: string, mode: ExpandedViewMode) => {
    const newExpandedViewMode = new Map(expandedViewMode);
    newExpandedViewMode.set(symbol, mode);
    setExpandedViewMode(newExpandedViewMode);
  };

  return {
    ...baseState,
    analyticsData,
    setAnalyticsData,
    expandedRows,
    sortField,
    sortDirection,
    expandedViewMode,
    showAllDeals,
    handleSort,
    toggleRowExpansion,
    toggleShowAllDeals,
    getExpandedViewMode,
    setExpandedViewModeForSymbol
  };
}
