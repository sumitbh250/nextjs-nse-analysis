// Reusable table components for deal data display

import React from 'react';
import { DealData, formatNumber, formatMarketCap, formatPrice } from './common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DealTableProps {
  columns: TableColumn[];
  data: DealData[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DealTable({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = 'No data available',
  className = ''
}: DealTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mb-3">
          <div className="w-6 h-6 text-white animate-spin border-2 border-white border-t-transparent rounded-full" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20 ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row: any, rowIndex: number) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300"
                    title={typeof row[column.key] === 'string' && row[column.key].length > 20 ? row[column.key] : undefined}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Predefined column configurations for different deal types
export const BULK_DEALS_COLUMNS: TableColumn[] = [
  { key: "DEAL_TYPE", label: "TYPE", render: (value) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      value === 'BULK' 
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
        : value === 'BLOCK'
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }`}>
      {value}
    </span>
  )},
  { key: "BD_DT_DATE", label: "DATE" },
  { key: "BD_SYMBOL", label: "SYMBOL" },
  { key: "BD_SCRIP_NAME", label: "COMPANY NAME", className: "max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" },
  { key: "MARKET_CAP", label: "MARKET CAP (Cr)", render: (value) => formatMarketCap(value) },
  { key: "PRICE", label: "STOCK PRICE", render: (value) => formatPrice(value) },
  { key: "BD_CLIENT_NAME", label: "CLIENT NAME", className: "max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" },
  { key: "BD_BUY_SELL", label: "BUY/SELL", render: (value) => (
    <span className={`font-medium ${value === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
      {value}
    </span>
  )},
  { key: "BD_QTY_TRD", label: "QUANTITY", render: (value) => formatNumber(value) },
  { key: "BD_TP_WATP", label: "DEAL PRICE", render: (value) => `₹${value.toFixed(2)}` },
  { key: "BD_REMARKS", label: "REMARKS", className: "max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" },
];

// Analytics table columns
export interface AnalyticsData {
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
}

export const ANALYTICS_COLUMNS: TableColumn[] = [
  { key: "symbol", label: "SYMBOL" },
  { key: "companyName", label: "COMPANY", className: "max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] truncate" },
  { key: "marketCap", label: "MCAP", render: (value) => formatMarketCap(value) },
  { key: "price", label: "PRICE", render: (value) => formatPrice(value) },
  { key: "askPrice", label: "ASK", render: (value) => value > 0 ? `₹${value.toFixed(1)}` : 'N/A' },
  { key: "totalBought", label: "QTY B", render: (value) => <span className="text-green-600 dark:text-green-400">{formatNumber(value)}</span> },
  { key: "totalSold", label: "QTY S", render: (value) => <span className="text-red-600 dark:text-red-400">{formatNumber(value)}</span> },
  { key: "totalValueBought", label: "VAL B", render: (value) => <span className="text-green-600 dark:text-green-400">₹{(value / 10000000).toFixed(1)}Cr</span> },
  { key: "totalValueSold", label: "VAL S", render: (value) => <span className="text-red-600 dark:text-red-400">₹{(value / 10000000).toFixed(1)}Cr</span> },
  { key: "netValue", label: "NET", render: (value) => (
    <span className={`font-medium ${value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      ₹{(Math.abs(value) / 10000000).toFixed(1)}Cr
    </span>
  )},
  { key: "dealCount", label: "CNT" },
];
