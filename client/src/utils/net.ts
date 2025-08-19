// Lightweight cached fetch + page visibility helpers
// TS 4.9-compatible

type Json = any;

type CacheEntry = {
  data: Json;
  expiry: number;
  inflight?: Promise<Json> | null;
};

const cache = new Map<string, CacheEntry>();

export interface CachedGetOptions {
  ttlMs?: number; // time to keep cached data
  keyExtra?: string; // include auth token or user id to keep caches isolated
  init?: RequestInit;
  force?: boolean; // ignore cache
}

const now = () => Date.now();

function makeKey(url: string, method: string, keyExtra?: string) {
  return `${method || 'GET'}:${url}::${keyExtra || ''}`;
}

export async function getCachedJson(url: string, opts: CachedGetOptions = {}): Promise<Json> {
  const method = (opts.init?.method || 'GET').toUpperCase();
  if (method !== 'GET') throw new Error('getCachedJson only supports GET');
  const ttl = typeof opts.ttlMs === 'number' ? opts.ttlMs : 15000;
  const key = makeKey(url, method, opts.keyExtra);
  const entry = cache.get(key);
  const t = now();
  if (!opts.force && entry && entry.expiry > t) {
    if (entry.inflight) return entry.inflight; // still resolving a prior fetch
    return entry.data;
  }
  if (!opts.force && entry?.inflight) return entry.inflight;

  const inflight = fetch(url, { ...opts.init })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cache.set(key, { data, expiry: now() + ttl, inflight: null });
      return data;
    })
    .catch((err) => {
      // On error, keep prior data (if any) until expiry; clear inflight
      if (entry) cache.set(key, { ...entry, inflight: null });
      throw err;
    });

  cache.set(key, { data: entry?.data, expiry: entry?.expiry || 0, inflight });
  return inflight;
}

export function clearCached(urlPrefix?: string) {
  if (!urlPrefix) { cache.clear(); return; }
  const p = urlPrefix.toLowerCase();
  for (const k of cache.keys()) {
    if (k.toLowerCase().includes(p)) cache.delete(k);
  }
}

// Page visibility hook to avoid polling when hidden
import { useEffect, useState } from 'react';
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}
