import type { SolveRecord } from '../game/types';

const RECORDS_KEY = 'clock-spots-open:records';
const SETTINGS_KEY = 'clock-spots-open:settings';

export interface Settings {
  easyMode: boolean;
  pollDismissed: boolean;
  pollVote?: 'yes' | 'no';
}

const defaultSettings: Settings = {
  easyMode: false,
  pollDismissed: false,
};

export function loadRecords(): SolveRecord[] {
  return readJson<SolveRecord[]>(RECORDS_KEY, []);
}

export function saveRecord(record: SolveRecord): void {
  const records = loadRecords();
  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function clearRecords(): void {
  localStorage.removeItem(RECORDS_KEY);
}

export function loadSettings(): Settings {
  return { ...defaultSettings, ...readJson<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportStatsCode(): string {
  const payload = {
    version: 1,
    records: loadRecords(),
    settings: loadSettings(),
  };
  return `cso1:${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
}

export function importStatsCode(code: string): { added: number; updated: number } {
  if (!code.startsWith('cso1:')) {
    throw new Error('Backup codes must start with cso1:');
  }

  const payload = JSON.parse(decodeURIComponent(escape(atob(code.slice(5))))) as {
    version: number;
    records?: SolveRecord[];
    settings?: Partial<Settings>;
  };

  if (payload.version !== 1 || !Array.isArray(payload.records)) {
    throw new Error('Unsupported backup code');
  }

  const current = loadRecords();
  let added = 0;
  let updated = 0;

  for (const record of payload.records) {
    const index = current.findIndex((item) => item.id === record.id);
    if (index >= 0) {
      current[index] = record;
      updated += 1;
    } else {
      current.push(record);
      added += 1;
    }
  }

  localStorage.setItem(RECORDS_KEY, JSON.stringify(current));
  if (payload.settings) {
    saveSettings({ ...loadSettings(), ...payload.settings });
  }

  return { added, updated };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
