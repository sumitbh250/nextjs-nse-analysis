"use client";

import { useEffect, useState } from 'react';
import { FaSyncAlt } from 'react-icons/fa';
import SimpleTable from '@/app/component/SimpleTable';
import Modal from '@/app/component/Modal';
import Navigation from '@/app/component/Navigation';

export default function UndervaluedEtfsPage() {
  const etf_data_columns = [
    { key: "symbol", label: "SYMBOL" },
    { key: "assets", label: "UNDERLYING ASSET" },
    { key: "companyName", label: "COMPANY NAME" },
    { key: "undervalued_pct", label: "UNDERVALUED PCT" },
    { key: "ltP", label: "LTP" },
    { key: "inav", label: "INAV" },
    { key: "nav", label: "NAV" },
    { key: "qty", label: "QUANTITY" },
    { key: "open", label: "OPEN" },
    { key: "high", label: "HIGH" },
    { key: "low", label: "LOW" },
  ];

  const [etfData, setEtfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function fetchEtfData() {
    try {
      const response = await fetch('/api/fetchETF');
      const data = await response.json();
      console.log('ETF data:', data);
      setEtfData(data);
    } catch (error) {
      console.error('Error fetching ETF data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEtfData();
  }, []);

  function refreshButton() {
    setEtfData(null);
    setLoading(true);
    setShowModal(false);
    fetchEtfData();
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="p-6">
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="p-6">
        {etfData && etfData.data ? (
          <>
            {showModal && <Modal />}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                  Undervalued ETF Data
                </h1>
              </div>
              <button
                onClick={refreshButton}
                disabled={loading}
                                  className="flex items-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700
                    disabled:bg-gray-400 rounded-lg transition-colors"
              >
                <FaSyncAlt className={loading ? 'animate-spin mr-2' : 'mr-2'} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <SimpleTable columns={etf_data_columns} data={etfData.data} />
          </>
        ) : (
          <p className="text-lg text-gray-600 dark:text-gray-400">No data available</p>
        )}
      </div>
    </div>
  );
}