export function parseCSVToJSON(csvData: string) {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [] as any[];

  const dataLines = lines.slice(1);
  const deals: any[] = [];

  for (const line of dataLines) {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    if (fields.length >= 7) {
      deals.push({
        BD_DT_DATE: fields[0].replace(/"/g, ''),
        BD_DT_ORDER: new Date(fields[0].replace(/"/g, '')).toISOString(),
        BD_SYMBOL: fields[1].replace(/"/g, ''),
        BD_SCRIP_NAME: fields[2].replace(/"/g, ''),
        BD_CLIENT_NAME: fields[3].replace(/"/g, ''),
        BD_BUY_SELL: fields[4].replace(/"/g, ''),
        BD_QTY_TRD: parseInt(fields[5].replace(/"/g, '').replace(/,/g, '')),
        BD_TP_WATP: parseFloat(fields[6].replace(/"/g, '').replace(/,/g, '')),
        BD_REMARKS: fields[7] ? fields[7].replace(/"/g, '') : '-',
      });
    }
  }

  return deals;
}


