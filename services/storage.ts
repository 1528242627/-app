import { DiaryEntry, ApiConfig } from '../types';

const STORAGE_KEY = 'soullog_entries';
const CONFIG_KEY = 'soullog_api_configs';

// --- Diary Entries ---

export const saveEntry = (entry: DiaryEntry): void => {
  const entries = getAllEntries();
  const existingIndex = entries.findIndex((e) => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const getEntryByDate = (dateStr: string): DiaryEntry | undefined => {
  const entries = getAllEntries();
  return entries.find((e) => e.date === dateStr);
};

export const getAllEntries = (): DiaryEntry[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Failed to parse entries", e);
    return [];
  }
};

export const getRecentEntries = (endDateStr: string, daysBack: number = 7): DiaryEntry[] => {
  const entries = getAllEntries();
  const endDate = new Date(endDateStr);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - daysBack);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= startDate && entryDate <= endDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// --- API Configs ---

export const saveApiConfigs = (configs: ApiConfig[]): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
};

export const getApiConfigs = (): ApiConfig[] => {
  try {
    const json = localStorage.getItem(CONFIG_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Failed to parse configs", e);
    return [];
  }
};
