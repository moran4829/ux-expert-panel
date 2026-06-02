const STORAGE_KEYS = {
  projects: 'uxpert_projects',
  expertOverrides: 'uxpert_expert_overrides',
  llmSettings: 'uxpert_llm_settings',
} as const;

export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveToStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function clearStorageKey(key: string) {
  localStorage.removeItem(key);
}

export { STORAGE_KEYS };

export function exportAppData(data: unknown, filename = 'uxpert-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
