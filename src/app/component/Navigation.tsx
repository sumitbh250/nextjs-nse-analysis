"use client";

import { usePathname } from 'next/navigation';
import { FaHome, FaChartLine, FaExchangeAlt, FaChartBar, FaUsers } from 'react-icons/fa';

export default function Navigation() {
  const pathname = usePathname();

  const navigationItems = [
    {
      label: 'Home',
      href: '/',
      icon: <FaHome className="w-4 h-4" />,
      active: pathname === '/',
      color: 'from-blue-500 to-purple-600'
    },
    {
      label: 'Undervalued ETFs',
      href: '/undervalued_etfs',
      icon: <FaChartLine className="w-4 h-4" />,
      active: pathname === '/undervalued_etfs',
      color: 'from-green-500 to-blue-600'
    },
    {
      label: 'Raw Deals',
      href: '/big-deals',
      icon: <FaExchangeAlt className="w-4 h-4" />,
      active: pathname === '/big-deals',
      color: 'from-orange-500 to-red-600'
    },
    {
      label: 'Deal Analytics',
      href: '/deal-analytics',
      icon: <FaChartBar className="w-4 h-4" />,
      active: pathname === '/deal-analytics',
      color: 'from-purple-500 to-pink-600'
    },
    {
      label: 'Client Analytics',
      href: '/client-analytics',
      icon: <FaUsers className="w-4 h-4" />,
      active: pathname === '/client-analytics',
      color: 'from-teal-500 to-cyan-600'
    },
    {
      label: 'Client-Stock Analytics',
      href: '/client-stock-analytics',
      icon: <FaChartLine className="w-4 h-4" />,
      active: pathname === '/client-stock-analytics',
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <FaChartLine className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NSE Analytics Hub
              </h1>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    item.active
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className={`mr-2 ${item.active ? 'transform scale-110' : 'group-hover:scale-110 transition-transform'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <div className="relative group">
              <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors">
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Mobile dropdown */}
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {navigationItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm transition-all duration-200 ${
                        item.active
                          ? `bg-gradient-to-r ${item.color} text-white mx-2 rounded-lg shadow-md`
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}