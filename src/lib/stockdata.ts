import axios from 'axios';

export async function fetchStockDataFromSheet(): Promise<{marketCap: Record<string, number>, price: Record<string, number>}> {
  const SHEET_ID = '1GgVqoQ96kED7U_6oHDKTxesQtva5a-vobZDjfYdRau8';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  try {
    const resp = await axios.get(csvUrl, { responseType: 'text', validateStatus: () => true });
    if (resp.status >= 200 && resp.status < 300 && typeof resp.data === 'string') {
      const lines = String(resp.data).split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return { marketCap: {}, price: {} };
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const symbolIdx = header.findIndex(h => h.includes('symbol'));
      const mcapIdx = header.findIndex(h => h.includes('market') && h.includes('cap'));
      const priceIdx = header.findIndex(h => h.includes('price'));
      if (symbolIdx === -1 || mcapIdx === -1) return { marketCap: {}, price: {} };
      const marketCapMap: Record<string, number> = {};
      const priceMap: Record<string, number> = {};
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const symbol = (row[symbolIdx] || '').trim().replace(/^"|"$/g, '');
        const mcapRaw = (row[mcapIdx] || '').trim().replace(/^"|"$/g, '');
        const mcapValue = Number(mcapRaw.replace(/,/g, ''));
        if (symbol && !Number.isNaN(mcapValue)) {
          marketCapMap[symbol] = mcapValue;
        }
        if (priceIdx !== -1) {
          const priceRaw = (row[priceIdx] || '').trim().replace(/^"|"$/g, '');
          const priceValue = Number(priceRaw.replace(/,/g, ''));
          if (symbol && !Number.isNaN(priceValue)) {
            priceMap[symbol] = priceValue;
          }
        }
      }
      return { marketCap: marketCapMap, price: priceMap };
    }
  } catch (e) {
    // ignore and fallback
  }
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    const resp = await axios.get(gvizUrl, { responseType: 'text', validateStatus: () => true });
    if (resp.status >= 200 && resp.status < 300 && typeof resp.data === 'string') {
      const jsonText = String(resp.data).replace(/^.*setResponse\(([\s\S]*)\);?\s*$/, '$1');
      const parsed = JSON.parse(jsonText);
      const rows = parsed.table?.rows || [];
      const cols = parsed.table?.cols || [];
      const symbolIdx = cols.findIndex((c: any) => String(c?.label || '').toLowerCase().includes('symbol'));
      const mcapIdx = cols.findIndex((c: any) => {
        const label = String(c?.label || '').toLowerCase();
        return label.includes('market') && label.includes('cap');
      });
      const priceIdx = cols.findIndex((c: any) => String(c?.label || '').toLowerCase().includes('price'));
      const marketCapMap: Record<string, number> = {};
      const priceMap: Record<string, number> = {};
      if (symbolIdx !== -1 && mcapIdx !== -1) {
        for (const r of rows) {
          const symbol = (r.c?.[symbolIdx]?.v || '').trim();
          const mcapValue = Number(String(r.c?.[mcapIdx]?.v || '').replace(/,/g, ''));
          if (symbol && !Number.isNaN(mcapValue)) {
            marketCapMap[symbol] = mcapValue;
          }
          if (priceIdx !== -1) {
            const priceValue = Number(String(r.c?.[priceIdx]?.v || '').replace(/,/g, ''));
            if (symbol && !Number.isNaN(priceValue)) {
              priceMap[symbol] = priceValue;
            }
          }
        }
      }
      return { marketCap: marketCapMap, price: priceMap };
    }
  } catch (e) {
    // ignore
  }
  return { marketCap: {}, price: {} };
}
