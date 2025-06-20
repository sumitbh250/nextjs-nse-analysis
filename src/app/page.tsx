"use client";

import { FaChartLine, FaExchangeAlt, FaChartBar, FaUsers, FaArrowUp, FaRocket, FaShieldAlt } from 'react-icons/fa';
import Navigation from './component/Navigation';
import Documentation from './component/Documentation';

export default function HomePage() {
  const navigationCards = [
    {
      title: "Undervalued ETFs",
      description: "Discover potentially undervalued ETFs on NSE by comparing market price with iNAV",
      icon: <FaChartLine className="w-8 h-8" />,
      href: "/undervalued_etfs",
      gradient: "from-emerald-400 via-blue-500 to-purple-600",
      hoverGradient: "from-emerald-500 via-blue-600 to-purple-700",
      features: ["Real-time iNAV comparison", "Undervaluation percentage", "Volume filtering", "Live market data"]
    },
    {
      title: "Bulk & Block Deals",
      description: "View raw bulk and block deals data from NSE with date filtering options",
      icon: <FaExchangeAlt className="w-8 h-8" />,
      href: "/big-deals",
      gradient: "from-orange-400 via-red-500 to-pink-600",
      hoverGradient: "from-orange-500 via-red-600 to-pink-700",
      features: ["Bulk deals data", "Block deals data", "Date range filtering", "Deal type selection"]
    },
    {
      title: "Bulk Deal Analytics",
      description: "Comprehensive analytics and insights for bulk deals with aggregated data per stock",
      icon: <FaChartBar className="w-8 h-8" />,
      href: "/bulk-deal-analytics",
      gradient: "from-purple-400 via-pink-500 to-red-500",
      hoverGradient: "from-purple-500 via-pink-600 to-red-600",
      features: ["Aggregated data per stock", "Buy/sell analysis", "Client insights", "Deal drilling"]
    },
    {
      title: "Block Deal Analytics",
      description: "Detailed analytics for block deals showing institutional trading patterns",
      icon: <FaUsers className="w-8 h-8" />,
      href: "/block-deal-analytics",
      gradient: "from-indigo-400 via-purple-500 to-pink-500",
      hoverGradient: "from-indigo-500 via-purple-600 to-pink-600",
      features: ["Institutional analysis", "Net position tracking", "Price range analysis", "Volume insights"]
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
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-6">
            <FaChartLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
            NSE Analytics Hub
            </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Comprehensive analysis tools for NSE market data including
            <span className="font-semibold text-blue-600 dark:text-blue-400"> ETF valuations</span>,
            <span className="font-semibold text-purple-600 dark:text-purple-400"> bulk & block deals</span>, and
            <span className="font-semibold text-indigo-600 dark:text-indigo-400"> institutional insights</span>
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto mb-16">
          {navigationCards.map((card, index) => (
            <a
              key={index}
              href={card.href}
              className={`group relative bg-gradient-to-br ${card.gradient} hover:${card.hoverGradient} text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mr-4 group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <h2 className="text-2xl font-bold">{card.title}</h2>
                </div>

                <p className="text-white/90 mb-8 leading-relaxed text-lg">
                  {card.description}
                </p>

                <div className="space-y-3 mb-8">
                  <h3 className="font-semibold text-white/95 text-lg">Key Features:</h3>
                  {card.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-white/80">
                      <div className="w-2 h-2 bg-white/60 rounded-full mr-3 group-hover:bg-white transition-colors" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center text-white/90 group-hover:text-white transition-colors">
                  <span className="text-lg font-medium">Explore now</span>
                  <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-300 mb-12">
            Why Choose NSE Analytics Hub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {statsCards.map((stat, index) => (
              <div key={index} className={`group bg-gradient-to-br ${stat.gradient} dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-fit mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                  {stat.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 max-w-5xl mx-auto border border-amber-200 dark:border-gray-600 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <FaShieldAlt className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-3">
                Investment Disclaimer
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-200 leading-relaxed">
                The information provided is for educational and informational purposes only and should not be
                construed as financial, investment, or trading advice. This is not a recommendation to buy,
                sell, or hold any securities. Please conduct your own research and consult with a qualified
                financial advisor before making any investment decisions. Investments are subject to market
                risks, and past performance is not indicative of future results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}