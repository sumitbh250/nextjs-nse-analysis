"use client";

import { useEffect, useState } from 'react';
import SimpleTable from '@/app/component/SimpleTable';
import Modal from '@/app/component/Modal';

export default function EtfPage() {

  const etf_data_columns = [
    { key: "symbol", label: "SYMBOL" },
    { key: "assets", label: "UNDERLYING ASSET" },
    { key: "companyName", label: "COMPANY NAME" },
    { key: "undervalued_pct", label: "UNDERVALUED PCT" },
    { key: "ltP", label: "LTP" },
    { key: "nav", label: "NAV" },
    { key: "qty", label: "QUANTITY" },
    { key: "open", label: "OPEN" },
    { key: "high", label: "HIGH" },
    { key: "low", label: "LOW" },
  ];

  const [etfData, setEtfData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchEtfData();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return ( <div>
      {etfData && etfData.data ? (
        <><Modal />
        <h1
        className={`
            text-2xl
            font-bold
            text-gray-800
            dark:text-gray-200
            mb-4
            text-center
          `}
      >
        Undervalued ETF Data
      </h1><SimpleTable columns={etf_data_columns} data={etfData.data} /></>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
}
