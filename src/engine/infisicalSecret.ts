/**
 * infisicalSecret.ts — Infisical-first secret resolution for Dev-Brain.
 *
 * Replaced `keywireSecret.ts` when Keywire was retired ecosystem-wide
 * (2026-10-15). Shared fleet credentials (the TypeSafe/Jev gateway key
 * `AI_GATEWAY_API_KEY`, etc.) live in the Infisical vault — project o365, path
 * `/overlay365-fleet/prod` — resolved through machine identity `mach1`.
 *
 * Credentials come from ONE place, the same file the CLI/MCP lane uses:
 *   INFRASTRUCTURE/infisical/.secrets/mach1.env  (CLIENT_ID / CLIENT_SECRET)
 * or INFISICAL_MACH1_CLIENT_ID / INFISICAL_MACH1_CLIENT_SECRET in the env.
 *
 * Order: Infisical FIRST, `process.env` LAST. Honesty contract: never throws,
 * never logs a value, returns `source:'none'` on total failure. A unit run can
 * be kept vault-free with DEV_BRAIN_DISABLE_INFISICAL=1.
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_URL = 'http://localhost:8081';
const TARGET_PROJECT_ID = '0d640b29-e93d-47ed-9447-d29365affb8a'; // Infisical o365
const DEFAULT_PATH = '/overlay365-fleet/prod';
const DEFAULT_ENV = 'prod';
const CRED_FILE =
  process.env.DEV_BRAIN_INFISICAL_CRED_FILE ||
  path.join('C:', 'Users', 'User', 'Downloads', 'BUSINESS', 'INFRASTRUCTURE', 'infisical', '.secrets', 'mach1.env');

const CACHE_TTL_MS = Number(process.env.DEV_BRAIN_SECRET_TTL_MS) || 10 * 60_000;
const TOKEN_TTL_MS = Number(process.env.DEV_BRAIN_INFISICAL_TOKEN_TTL_MS) || 20 * 60 * 60 * 1000; // 20h < 30d token

function creds(): { id: string; secret: string } {
  try {
    const buf = fs.readFileSync(CRED_FILE);
    if (buf.subarray(0, 2).toString('hex') === 'fffe') return { id: '', secret: '' }; // UTF-16 junk
    const m = Object.fromEntries(
      buf.toString('utf8')
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        }),
    );
    return { id: m.CLIENT_ID ?? '', secret: m.CLIENT_SECRET ?? '' };
  } catch {
    return { id: '', secret: '' };
  }
}

function cfg(env: NodeJS.ProcessEnv = process.env) {
  const file = creds();
  return {
    url: (env.DEV_BRAIN_INFISICAL_URL || env.INFISICAL_URL || DEFAULT_URL).replace(/\/+$/, ''),
    secretPath: env.DEV_BRAIN_INFISICAL_PATH || DEFAULT_PATH,
    envSlug: env.DEV_BRAIN_INFISICAL_ENV || DEFAULT_ENV,
    clientId: env.INFISICAL_MACH1_CLIENT_ID || file.id,
    clientSecret: env.INFISICAL_MACH1_CLIENT_SECRET || file.secret,
  };
}

/** Are usable credentials present and the lane enabled? */
export function infisicalConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.DEV_BRAIN_DISABLE_INFISICAL === '1') return false;
  const c = cfg(env);
  return Boolean(c.clientId && c.clientSecret);
}

let tokenCache: { at: number; token: string } | null = null;

async function login(c: ReturnType<typeof cfg>, timeoutMs: number): Promise<string> {
  try {
    const r = await fetch(`${c.url}/api/v1/auth/universal-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: c.clientId, clientSecret: c.clientSecret }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return '';
    const j = (await r.json().catch(() => null)) as { accessToken?: unknown } | null;
    return typeof j?.accessToken === 'string' ? j.accessToken : '';
  } catch {
    return '';
  }
}

async function bearer(c: ReturnType<typeof cfg>, timeoutMs: number): Promise<string> {
  const now = Date.now();
  if (tokenCache && now - tokenCache.at < TOKEN_TTL_MS) return tokenCache.token;
  const token = await login(c, timeoutMs);
  if (token) tokenCache = { at: now, token };
  return token;
}

async function fetchFromInfisical(key: string): Promise<string> {
  if (process.env.DEV_BRAIN_DISABLE_INFISICAL === '1') return '';
  const c = cfg();
  if (!c.clientId || !c.clientSecret) return '';
  const timeoutMs = Number(process.env.DEV_BRAIN_INFISICAL_TIMEOUT_MS) || 6000;
  try {
    const token = await bearer(c, timeoutMs);
    if (!token) return '';
    const q = new URLSearchParams({
      workspaceId: TARGET_PROJECT_ID,
      environment: c.envSlug,
      secretPath: c.secretPath,
      viewSecretValue: 'true',
    });
    const r = await fetch(`${c.url}/api/v3/secrets/raw/${encodeURIComponent(key)}?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return '';
    const j = (await r.json().catch(() => null)) as { secret?: { secretValue?: unknown } } | null;
    const v = j?.secret?.secretValue;
    return typeof v === 'string' ? v : '';
  } catch {
    return '';
  }
}

const valueCache = new Map<string, { value: string; at: number }>();

export interface ResolvedSecret {
  value: string;
  source: 'infisical' | 'env' | 'none';
}

/** Resolve a secret Infisical-FIRST, env fallback (cached). Never throws. */
export async function resolveSecret(key: string, opts: { preferInfisical?: boolean } = {}): Promise<ResolvedSecret> {
  const prefer = opts.preferInfisical !== false;
  const envValue = (process.env[key] || '').trim();

  if (!prefer && envValue) return { value: envValue, source: 'env' };

  const cached = valueCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return { value: cached.value, source: 'infisical' };

  const value = await fetchFromInfisical(key);
  if (value) {
    valueCache.set(key, { value, at: Date.now() });
    return { value, source: 'infisical' };
  }
  if (envValue) return { value: envValue, source: 'env' };
  return { value: '', source: 'none' };
}

/** Test/reset hook — clears the in-memory caches. */
export function resetSecretCache(): void {
  valueCache.clear();
  tokenCache = null;
}
