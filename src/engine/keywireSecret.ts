/**
 * keywireSecret.ts — Keywire-first secret resolution for Dev-Brain.
 *
 * Shared fleet credentials (the TypeSafe/Jev gateway key `AI_GATEWAY_API_KEY`,
 * etc.) live in the Keywire zero-trust vault — project `prj-mt7jrul1`
 * (overlay365-fleet) / env `production` — NOT in committed env files. This module
 * resolves a secret from Keywire FIRST and falls back to `process.env` only when
 * the vault is unavailable or does not hold the key.
 *
 * Auth chain (mirrors Axiom's src/server/fleet.ts — the proven path):
 *   1. POST {KEYWIRE_URL}/api/v1/auth/service-token/exchange { token: KEYWIRE_SERVICE_TOKEN }
 *      -> { accessToken }   (short-lived vault JWT)
 *   2. GET  {KEYWIRE_URL}/api/v1/projects/:project/envs/:env/secrets?unmask=true
 *      with `Authorization: Bearer <accessToken>` -> [{ key, value }, ...]
 *
 * Honesty contract: never throws, never logs a value, returns `source:'none'`
 * on total failure so callers keep their own deterministic fallback.
 */

const DEFAULT_URL = 'http://127.0.0.1:3000';
const DEFAULT_PROJECT = 'prj-mt7jrul1'; // overlay365-fleet
const DEFAULT_ENV = 'production';

function cfg(): { url: string; token: string; project: string; env: string } {
  return {
    url: (process.env.KEYWIRE_URL || DEFAULT_URL).replace(/\/+$/, ''),
    token: (process.env.KEYWIRE_SERVICE_TOKEN || '').trim(),
    project: process.env.KEYWIRE_PROJECT_ID || DEFAULT_PROJECT,
    env: process.env.KEYWIRE_ENV_SLUG || DEFAULT_ENV,
  };
}

const CACHE_TTL_MS = Number(process.env.KEYWIRE_SECRET_TTL_MS) || 10 * 60_000;

interface CacheEntry { value: string; at: number }

const valueCache = new Map<string, CacheEntry>();
let secretsCache: { at: number; secrets: Record<string, string> } | null = null;

export function keywireConfigured(): boolean {
  return Boolean(cfg().token);
}

async function exchangeToken(): Promise<string> {
  const c = cfg();
  if (!c.token) return '';
  try {
    const r = await fetch(`${c.url}/api/v1/auth/service-token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: c.token }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return '';
    const j = (await r.json().catch(() => null)) as { accessToken?: unknown } | null;
    return typeof j?.accessToken === 'string' ? j.accessToken : '';
  } catch {
    return '';
  }
}

async function fetchAllSecrets(): Promise<Record<string, string>> {
  if (secretsCache && Date.now() - secretsCache.at < CACHE_TTL_MS) return secretsCache.secrets;
  const c = cfg();
  if (!c.token) return {};
  const bearer = await exchangeToken();
  if (!bearer) return {};
  try {
    const r = await fetch(`${c.url}/api/v1/projects/${c.project}/envs/${c.env}/secrets?unmask=true`, {
      headers: { Authorization: `Bearer ${bearer}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) return {};
    const rows = (await r.json().catch(() => null)) as Array<{ key?: unknown; value?: unknown }> | null;
    if (!Array.isArray(rows)) return {};
    const secrets: Record<string, string> = {};
    for (const row of rows) {
      const k = row?.key;
      const v = row?.value;
      if (!k || v === undefined || v === null) continue;
      secrets[String(k)] = String(v);
    }
    secretsCache = { at: Date.now(), secrets };
    return secrets;
  } catch {
    return {};
  }
}

export interface ResolvedSecret {
  value: string;
  source: 'keywire' | 'env' | 'none';
}

/** Resolve a secret Keywire-FIRST, env fallback (cached). Never throws. */
export async function resolveSecret(key: string, opts: { preferKeywire?: boolean } = {}): Promise<ResolvedSecret> {
  const preferKeywire = opts.preferKeywire !== false;
  const envValue = (process.env[key] || '').trim();

  if (!preferKeywire && envValue) return { value: envValue, source: 'env' };

  const cached = valueCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return { value: cached.value, source: 'keywire' };

  const secrets = await fetchAllSecrets();
  const kwValue = (secrets[String(key)] || '').trim();
  if (kwValue) {
    valueCache.set(String(key), { value: kwValue, at: Date.now() });
    return { value: kwValue, source: 'keywire' };
  }
  if (envValue) return { value: envValue, source: 'env' };
  return { value: '', source: 'none' };
}

/** Test/reset hook — clears the in-memory vault cache. */
export function resetKeywireSecretCache(): void {
  valueCache.clear();
  secretsCache = null;
}
