// Common utilities for all deal-related pages

export interface DealData {
  BD_DT_DATE: string;
  BD_SYMBOL: string;
  BD_SCRIP_NAME: string;
  BD_CLIENT_NAME: string;
  BD_BUY_SELL: string;
  BD_QTY_TRD: number;
  BD_TP_WATP: number;
  BD_REMARKS: string;
  DEAL_TYPE?: string;
}

export interface DateFilter {
  label: string;
  days: number;
}

export interface DateRange {
  from: string;
  to: string;
  fromDisplay: string;
  toDisplay: string;
}

// Common date filters used across all pages
export const DATE_FILTERS: DateFilter[] = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

/**
 * Formats date string for API calls (DD-MM-YYYY format)
 */
export function formatDateForAPI(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats date string for display (DD-MM-YYYY format)
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats date for HTML input (YYYY-MM-DD format)
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formats numbers with Indian number system (lakhs, crores)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Formats market cap values with appropriate units
 */
export function formatMarketCap(value: number): string {
  if (!value || value === 0) return 'Not found';
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K Cr`;
  }
  return `₹${value.toFixed(0)} Cr`;
}

/**
 * Formats price values
 */
export function formatPrice(value: number): string {
  if (!value || value === 0) return 'Not found';
  return `₹${value.toFixed(2)}`;
}

/**
 * Calculates date range based on filter selection
 */
export function getDateRange(
  dateFilter: string,
  customFromDate: string,
  customToDate: string
): DateRange {
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
  const selectedFilter = DATE_FILTERS.find(f => f.label === dateFilter);
  
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

/**
 * Handles time range change and returns new dates
 */
export function handleTimeRangeChange(
  range: string,
  currentDateFilter: string
): { 
  newDateFilter: string; 
  fromDate?: string; 
  toDate?: string; 
} {
  if (range === 'Custom') {
    return { newDateFilter: 'Custom' };
  }

  if (range === 'Clear') {
    return { newDateFilter: '1W' };
  }

  const today = new Date();
  const selectedFilter = DATE_FILTERS.find(f => f.label === range);

  if (selectedFilter) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - selectedFilter.days);
    
    return {
      newDateFilter: range,
      fromDate: formatDateForInput(startDate),
      toDate: formatDateForInput(today)
    };
  }

  return { newDateFilter: currentDateFilter };
}

/**
 * Common deal type options
 */
export const DEAL_TYPE_OPTIONS = [
  { value: 'bulk_deals', label: 'Bulk Deals' },
  { value: 'block_deals', label: 'Block Deals' },
  { value: 'both', label: 'Both' },
];

/**
 * Common validation functions
 */
export function validateDateRange(fromDate: string, toDate: string): boolean {
  if (!fromDate || !toDate) return false;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return from <= to;
}

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  INVALID_DATE_RANGE: 'Please select a valid date range',
  MISSING_DATES: 'Please select both from and to dates',
  API_ERROR: 'An error occurred while fetching data',
  NO_DATA: 'No data available for the selected criteria'
} as const;
