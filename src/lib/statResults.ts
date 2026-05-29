import { apiFetch } from './api';

export type StatRow = Record<string, any>;

type StatChunkResponse = {
  stat_id: number | string;
  result_mode: 'single' | 'chunked';
  sort_order?: number;
  chunks_count?: number;
  json_results?: StatRow[];
};

type CachedStatRows = {
  rows: StatRow[];
  cachedAt: number;
  lastexec_time?: string | null;
};

const MAX_CACHED_STATS = 3;
const statRowsCache = new Map<number, CachedStatRows>();

function rememberRows(statId: number, entry: CachedStatRows) {
  if (statRowsCache.has(statId)) {
    statRowsCache.delete(statId);
  }

  statRowsCache.set(statId, entry);

  while (statRowsCache.size > MAX_CACHED_STATS) {
    const oldestKey = statRowsCache.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    statRowsCache.delete(oldestKey);
  }
}

export function parseJsonArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Unable to parse JSON array:', error);
    return [];
  }
}

export function invalidateStatRows(statId?: number | string) {
  if (statId === undefined || statId === null) {
    statRowsCache.clear();
    return;
  }

  statRowsCache.delete(Number(statId));
}

export async function loadRowsForStat(raw: any): Promise<StatRow[]> {
  const statId = Number(raw?.id);

  if (!statId) {
    return [];
  }

  const lastexecTime = raw?.lastexec_time ?? null;
  const cached = statRowsCache.get(statId);

  if (cached && cached.lastexec_time === lastexecTime) {
    return cached.rows;
  }

  let rows: StatRow[] = [];

  if (raw?.result_mode !== 'chunked') {
    rows = parseJsonArray<StatRow>(raw?.json_results);
  } else {
    const chunksCount = Number(raw.chunks_count ?? raw.json_chunks_count ?? 0);

    for (let chunk = 1; chunk <= chunksCount; chunk++) {
      const response = await apiFetch<StatChunkResponse>(`v1/stats/${statId}/chunks/${chunk}`);

      if (Array.isArray(response.json_results)) {
        rows.push(...response.json_results);
      }
    }
  }

  rememberRows(statId, {
    rows,
    cachedAt: Date.now(),
    lastexec_time: lastexecTime,
  });

  return rows;
}
