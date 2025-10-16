import axios from 'axios';

export function buildBrowserHeaders(cookieString?: string, forJson: boolean = false, refererOverride?: string) {
  const headers: Record<string, string> = {
    'User-Agent':
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
      `(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36`,
    'Accept': forJson ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': refererOverride || 'https://www.nseindia.com/',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Host': 'www.nseindia.com',
    'Origin': 'https://www.nseindia.com',
    'sec-ch-ua': '"Chromium";v="121", "Not(A:Brand";v="24", "Google Chrome";v="121"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': forJson ? 'cors' : 'navigate',
    'Sec-Fetch-Dest': forJson ? 'empty' : 'document',
  };
  if (cookieString) headers['Cookie'] = cookieString;
  if (forJson) headers['X-Requested-With'] = 'XMLHttpRequest';
  return headers;
}

export function toCookieString(setCookieHeaders: string[] | undefined): string {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return '';
  const nameValuePairs = setCookieHeaders.map((c) => c.split(';')[0]).filter(Boolean);
  return nameValuePairs.join('; ');
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function tryGet(url: string, headers: Record<string, string>) {
  try {
    return await axios.get(url, { headers, validateStatus: () => true });
  } catch (e) {
    return undefined;
  }
}


