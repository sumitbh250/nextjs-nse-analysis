"use client";

import { useEffect, useState } from 'react';
import { FaSyncAlt } from 'react-icons/fa';
import SimpleTable from '@/app/component/SimpleTable';
import Modal from '@/app/component/Modal';

export default function EtfPage() {
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
  const [showModal, setShowModal] = useState(true);

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
    return <p>Loading...</p>;
  }

  return (
    <div>
      {etfData && etfData.data ? (
        <>
          {showModal && <Modal />}
          <div className="flex justify-between items-center mt-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Undervalued ETF Data
            </h1>
            <button
              onClick={refreshButton}
              disabled={loading}
              style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              fontSize: '16px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: loading ? '#ddd' : '#0070f3',
              borderRadius: '4px',
              color: '#fff',
              }}
            >
              <FaSyncAlt />
            </button>
          </div>
          <SimpleTable columns={etf_data_columns} data={etfData.data} />
        </>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
}