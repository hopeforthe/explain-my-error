const DAILY_LIMIT = 5;
const STORAGE_KEY = "explain-my-error-queries";

interface RateLimitData {
  date: string;
  count: number;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getData(): RateLimitData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getToday(), count: 0 };
    const data: RateLimitData = JSON.parse(raw);
    if (data.date !== getToday()) return { date: getToday(), count: 0 };
    return data;
  } catch {
    return { date: getToday(), count: 0 };
  }
}

export function getRemainingQueries(): number {
  return Math.max(0, DAILY_LIMIT - getData().count);
}

export function canQuery(): boolean {
  return getRemainingQueries() > 0;
}

export function recordQuery(): void {
  const data = getData();
  data.count += 1;
  data.date = getToday();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
