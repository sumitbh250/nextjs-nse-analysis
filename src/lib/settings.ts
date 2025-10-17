// Persistent settings utility for filters and preferences

export interface FilterSettings {
  hideIntraday: boolean;
  dealType: string;
  dateFilter: string;
  fromDate?: string;
  toDate?: string;
}

const DEFAULT_SETTINGS: FilterSettings = {
  hideIntraday: true, // Default to hiding intraday trades
  dealType: 'both',
  dateFilter: '1W',
  fromDate: '',
  toDate: ''
};

const STORAGE_KEY = 'nse-analysis-settings';

export function getStoredSettings(): FilterSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to parse stored settings:', error);
  }
  
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<FilterSettings>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = getStoredSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save settings:', error);
  }
}

export function resetSettings(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to reset settings:', error);
  }
}
