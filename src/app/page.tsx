"use client";

import { FaChartLine, FaExchangeAlt, FaChartBar, FaUsers, FaArrowUp, FaRocket, FaShieldAlt, FaBuilding } from 'react-icons/fa';
import Navigation from './component/Navigation';
import Documentation from './component/Documentation';

export default function HomePage() {
  const navigationCards = [
    {
      title: "Undervalued ETFs",
      description: "Discover potentially undervalued ETFs by comparing market price with iNAV",
      icon: <FaChartLine className="w-6 h-6" />,
      href: "/undervalued_etfs",
      gradient: "from-emerald-500 to-blue-600",
      category: "Investment Analysis"
    },
    {
      title: "Raw Deals Data",
      description: "View unprocessed bulk and block deals data with filtering options",
      icon: <FaExchangeAlt className="w-6 h-6" />,
      href: "/big-deals",
      gradient: "from-orange-500 to-red-600",
      category: "Raw Data"
    },
    {
      title: "Deal Analytics",
      description: "Comprehensive analysis of bulk and block deals with multiple aggregation views",
      icon: <FaChartBar className="w-6 h-6" />,
      href: "/deal-analytics",
      gradient: "from-purple-500 to-pink-600",
      category: "Deal Analytics"
    },
    {
      title: "Client Analytics",
      description: "Client-focused analysis showing trading activity across all stocks",
      icon: <FaUsers className="w-6 h-6" />,
      href: "/client-analytics",
      gradient: "from-teal-500 to-cyan-600",
      category: "Client Analytics"
    },
    {
      title: "Client-Stock Analytics",
      description: "Detailed per-client per-stock combination analysis with full drill-downs",
      icon: <FaBuilding className="w-6 h-6" />,
      href: "/client-stock-analytics",
      gradient: "from-emerald-500 to-teal-600",
      category: "Client Analytics"
    }
  ];

  const statsCards = [
    {
      icon: <FaArrowUp className="w-6 h-6 text-emerald-500" />,
      title: "Real-time Data",
      description: "Live market data from NSE with real-time updates and accurate calculations",
      gradient: "from-emerald-50 to-blue-50"
    },
    {
      icon: <FaChartBar className="w-6 h-6 text-blue-500" />,
      title: "Advanced Analytics",
      description: "Comprehensive analytics with sorting, filtering, and drill-down capabilities",
      gradient: "from-blue-50 to-purple-50"
    },
    {
      icon: <FaRocket className="w-6 h-6 text-purple-500" />,
      title: "Institutional Insights",
      description: "Track institutional trading patterns and market movements",
      gradient: "from-purple-50 to-pink-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navigation />
      <Documentation />
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mb-4">
            <FaChartLine className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 leading-tight">
            NSE Analytics Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Comprehensive analysis tools for NSE market data including ETF valuations, bulk & block deals, and institutional insights
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-16">
          {navigationCards.map((card, index) => (
            <a
              key={index}
              href={card.href}
              className={`group relative bg-gradient-to-br ${card.gradient} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                    {card.category}
                  </span>
                </div>

                <h2 className="text-lg font-bold mb-3">{card.title}</h2>
                <p className="text-white/90 mb-4 text-sm leading-relaxed">
                  {card.description}
                </p>

                <div className="flex items-center text-white/90 group-hover:text-white transition-colors">
                  <span className="text-sm font-medium">Access →</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-300 mb-8">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {statsCards.map((stat, index) => (
              <div key={index} className={`group bg-gradient-to-br ${stat.gradient} dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20`}>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 w-fit mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {stat.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 max-w-3xl mx-auto border border-amber-200 dark:border-gray-600 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <FaShieldAlt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-800 dark:text-amber-300 mb-2">
                Investment Disclaimer
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-200 leading-relaxed">
                This information is for educational purposes only and should not be construed as financial advice.
                Please conduct your own research and consult with a qualified financial advisor before making any investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}