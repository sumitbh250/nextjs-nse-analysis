"use client";

import { useState } from 'react';
import { FaQuestion, FaTimes, FaChartLine, FaUsers, FaFilter, FaSort } from 'react-icons/fa';

export default function Documentation() {
  const [isOpen, setIsOpen] = useState(false);

  const features = [
    {
      icon: <FaChartLine className="w-5 h-5 text-blue-500" />,
      title: "Undervalued ETFs",
      description: "Compare ETF market prices with iNAV to find undervalued opportunities",
      howTo: "• Look for negative percentages (undervalued)\n• Check volume for liquidity\n• Use sorting to find best opportunities"
    },
    {
      icon: <FaUsers className="w-5 h-5 text-purple-500" />,
      title: "Raw Deals Data",
      description: "Browse bulk and block deals with date filtering",
      howTo: "• Select deal type (Bulk/Block)\n• Choose time period or custom dates\n• View detailed transaction data"
    },
    {
      icon: <FaFilter className="w-5 h-5 text-green-500" />,
      title: "Analytics Pages",
      description: "Advanced aggregated analysis of bulk/block deals",
      howTo: "• Data grouped by stock symbol\n• Click arrows to expand details\n• Sort by any column header\n• View market cap and net positions"
    },
    {
      icon: <FaSort className="w-5 h-5 text-orange-500" />,
      title: "Navigation Tips",
      description: "Quick tips for efficient navigation",
      howTo: "• Use time range buttons for quick filtering\n• Custom dates for specific periods\n• Sort tables by clicking column headers\n• Expand rows for detailed information"
    }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
        title="Help & Documentation"
      >
        <FaQuestion className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📚 NSE Analytics Hub - User Guide
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {feature.description}
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-blue-500">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">How to use:</h4>
                      <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line font-mono">
                        {feature.howTo}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-amber-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-3">
                💡 Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-200">
                <li>• Data is fetched in real-time from NSE APIs</li>
                <li>• Market cap values are in crores (₹ Cr)</li>
                <li>• Use keyboard shortcuts: Esc to close modals</li>
                <li>• Tables are fully sortable - click any column header</li>
                <li>• All pages are mobile-responsive</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-red-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-3">
                ⚠️ Important Notes
              </h3>
              <ul className="space-y-2 text-sm text-red-700 dark:text-red-200">
                <li>• This tool is for educational purposes only</li>
                <li>• Not financial advice - consult professionals</li>
                <li>• Market data may have delays</li>
                <li>• Past performance doesn't predict future results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}