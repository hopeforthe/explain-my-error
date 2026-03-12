const HISTORY_KEY = "eme_error_history";
const MAX_HISTORY = 100;

export interface ErrorHistoryItem {
  id: string;
  errorMessage: string;
  language: string;
  framework?: string;
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

export function addErrorHistory(errorMessage: string, language: string, framework?: string): ErrorHistoryItem {
  const items = getErrorHistory();
  const item: ErrorHistoryItem = {
    id: crypto.randomUUID(),
    errorMessage,
    language,
    framework,
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

// Simple similarity check: normalize and compare keywords
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalize(a).split(" "));
  const setB = new Set(normalize(b).split(" "));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function findSimilarError(errorMessage: string): ErrorHistoryItem | null {
  const items = getErrorHistory();
  let bestMatch: ErrorHistoryItem | null = null;
  let bestScore = 0;

  for (const item of items) {
    const score = jaccardSimilarity(errorMessage, item.errorMessage);
    if (score > 0.6 && score > bestScore && item.errorMessage !== errorMessage) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

// Trend data helpers
export interface ErrorTrendData {
  languageCounts: Record<string, number>;
  frameworkCounts: Record<string, number>;
  dailyCounts: Record<string, number>;
  totalErrors: number;
  topErrors: { message: string; count: number }[];
}

export function getErrorTrends(): ErrorTrendData {
  const items = getErrorHistory();
  const languageCounts: Record<string, number> = {};
  const frameworkCounts: Record<string, number> = {};
  const dailyCounts: Record<string, number> = {};
  const errorCounts: Record<string, number> = {};

  for (const item of items) {
    languageCounts[item.language] = (languageCounts[item.language] || 0) + 1;
    if (item.framework && item.framework !== "None") {
      frameworkCounts[item.framework] = (frameworkCounts[item.framework] || 0) + 1;
    }
    const day = new Date(item.timestamp).toLocaleDateString();
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;

    // Group similar errors
    const key = normalize(item.errorMessage).slice(0, 60);
    errorCounts[key] = (errorCounts[key] || 0) + 1;
  }

  const topErrors = Object.entries(errorCounts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { languageCounts, frameworkCounts, dailyCounts, totalErrors: items.length, topErrors };
}
