const PROGRESS_KEY = 'pm_progress_v1';
const SETTINGS_KEY = 'pm_settings_v1';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed } as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private mode / quota) — fail silently
  }
}

export function clearAll(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

export const STORAGE_KEYS = {
  progress: PROGRESS_KEY,
  settings: SETTINGS_KEY,
};
