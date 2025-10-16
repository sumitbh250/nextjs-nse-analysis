import axios from 'axios';

export async function fetchMarketCapMapFromSheet(): Promise<Record<string, number>> {
  const SHEET_ID = '1GgVqoQ96kED7U_6oHDKTxesQtva5a-vobZDjfYdRau8';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  try {
    const resp = await axios.get(csvUrl, { responseType: 'text', validateStatus: () => true });
    if (resp.status >= 200 && resp.status < 300 && typeof resp.data === 'string') {
      const lines = String(resp.data).split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return {};
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const symbolIdx = header.findIndex(h => h.includes('symbol'));
      const mcapIdx = header.findIndex(h => h.includes('market') && h.includes('cap'));
      if (symbolIdx === -1 || mcapIdx === -1) return {};
      const map: Record<string, number> = {};
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const symbol = (row[symbolIdx] || '').trim().replace(/^"|"$/g, '');
        const valRaw = (row[mcapIdx] || '').trim().replace(/^"|"$/g, '');
        const value = Number(valRaw.replace(/,/g, ''));
        if (symbol && !Number.isNaN(value)) {
          map[symbol] = value;
        }
      }
      return map;
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
      const map: Record<string, number> = {};
      if (symbolIdx !== -1 && mcapIdx !== -1) {
        for (const r of rows) {
          const symbol = (r.c?.[symbolIdx]?.v || '').trim();
          const value = Number(String(r.c?.[mcapIdx]?.v || '').replace(/,/g, ''));
          if (symbol && !Number.isNaN(value)) {
            map[symbol] = value;
          }
        }
      }
      return map;
    }
  } catch (e) {
    // ignore
  }
  return {};
}


