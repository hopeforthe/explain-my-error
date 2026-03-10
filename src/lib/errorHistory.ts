const HISTORY_KEY = "eme_error_history";
const MAX_HISTORY = 50;

export interface ErrorHistoryItem {
  id: string;
  errorMessage: string;
  language: string;
  timestamp: number;
}

export function getErrorHistory(): ErrorHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addErrorHistory(errorMessage: string, language: string): ErrorHistoryItem {
  const items = getErrorHistory();
  const item: ErrorHistoryItem = {
    id: crypto.randomUUID(),
    errorMessage,
    language,
    timestamp: Date.now(),
  };
  const updated = [item, ...items].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return item;
}

export function deleteErrorHistory(id: string) {
  const items = getErrorHistory().filter((i) => i.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function clearErrorHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
