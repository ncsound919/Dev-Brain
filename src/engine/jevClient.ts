/**
 * jevClient.ts — TypeSafe Jev (System One) typed-decision client for Dev-Brain.
 *
 * Jev answers `choice` / `noul` / `score` questions over a `state` in one
 * forward pass with calibrated probabilities. Dev-Brain reaches it through the
 * Vercel AI Gateway TypeSafe lane (default https://ai-gateway.vercel.sh/typesafe,
 * model `typesafe-ai/jev`), sharing the fleet AI_GATEWAY_API_KEY.
 *
 * Honesty contract: no key, non-2xx, or timeout => `ok:false` with the real
 * error. Never a fabricated probability. The deterministic decision matrix
 * stays authoritative; Jev adds a calibrated advisory alongside it.
 */

import type { DecisionMatrixResult, WeightedDecisionOption } from '../types';
import { resolveSecret } from './keywireSecret';

export type JevState = string | unknown[] | Record<string, unknown>;

export interface JevChoiceQuestion {
  type: 'choice';
  instructions: unknown;
  criteria: Record<string, unknown>;
}

export interface JevNoulQuestion {
  type: 'noul';
  instructions: unknown;
  criteria?: { true: unknown; false: unknown } | null;
}

export interface JevScoreQuestion {
  type: 'score';
  instructions: unknown;
  criteria: unknown[];
}

export type JevQuestion = JevChoiceQuestion | JevNoulQuestion | JevScoreQuestion;

export type JevAnswer =
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
  | { type: 'noul'; noul: number }
  | { type: 'score'; score: number; legend: Record<string, unknown>; probabilities: Record<string, number>; confidence: number };

export interface JevTierConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface JevConfig {
  /** Master switch: DEV_BRAIN_JEV_ENABLED (default on). */
  enabled: boolean;
  timeoutMs: number;
  /** Tier 1 — Vercel AI Gateway TypeSafe lane (needs a key). */
  gateway: JevTierConfig;
  /** Tier 2 — LocalJev on :8080 (no key required). */
  local: JevTierConfig;
}

const GATEWAY_BASE_URL_DEFAULT = 'https://ai-gateway.vercel.sh/typesafe';
const GATEWAY_MODEL_DEFAULT = 'typesafe-ai/jev';
const LOCAL_BASE_URL_DEFAULT = 'http://127.0.0.1:8080';
const LOCAL_MODEL_DEFAULT = 'jev-latest';

/** Keywire vault key name for the Vercel AI Gateway / TypeSafe credential. */
const GATEWAY_KEY_NAME = 'AI_GATEWAY_API_KEY';

type GatewayKeySource = 'keywire' | 'env' | 'none' | 'unresolved';
let resolvedGatewayKey: string | undefined;
let gatewayKeySource: GatewayKeySource = 'unresolved';

/** Resolve the gateway key Keywire-FIRST (env fallback), once per process. */
export async function ensureJevGatewayKey(): Promise<string> {
  if (gatewayKeySource !== 'unresolved') return resolvedGatewayKey ?? '';
  const r = await resolveSecret(GATEWAY_KEY_NAME, { preferKeywire: true });
  resolvedGatewayKey = r.value || undefined;
  gatewayKeySource = r.source;
  return resolvedGatewayKey ?? '';
}

/** Where the gateway key came from — observable via /api/jev/status. */
export function jevGatewayKeySource(): GatewayKeySource {
  return gatewayKeySource;
}

export function jevConfig(): JevConfig {
  const gateway: JevTierConfig = {
    baseUrl: (process.env.TYPESAFE_BASE_URL || GATEWAY_BASE_URL_DEFAULT).replace(/\/+$/, ''),
    apiKey: (resolvedGatewayKey ?? process.env.TYPESAFE_API_KEY ?? process.env.AI_GATEWAY_API_KEY ?? '').trim(),
    model: process.env.TYPESAFE_MODEL || GATEWAY_MODEL_DEFAULT,
  };
  const local: JevTierConfig = {
    baseUrl: (process.env.JEV_LOCAL_BASE_URL || LOCAL_BASE_URL_DEFAULT).replace(/\/+$/, ''),
    apiKey: '',
    model: process.env.JEV_LOCAL_MODEL || LOCAL_MODEL_DEFAULT,
  };
  const enabled = process.env.DEV_BRAIN_JEV_ENABLED !== '0';
  const timeoutMs = Number(process.env.JEV_TIMEOUT_MS) || 10_000;
  return { enabled, timeoutMs, gateway, local };
}

/** Is any Jev tier usable (enabled + a base URL)? The gateway needs a key to be
 *  *reachable*, but the local tier is always a valid target. */
export function jevEnabled(): boolean {
  const c = jevConfig();
  return c.enabled && (Boolean(c.gateway.baseUrl) || Boolean(c.local.baseUrl));
}

export interface JevTierStatus {
  id: 'gateway' | 'local';
  baseUrl: string;
  model: string;
  online: boolean;
  error?: string;
}

export interface JevStatus {
  configured: boolean;
  enabled: boolean;
  tiers: JevTierStatus[];
  online: boolean;
  checkedAt?: number;
  /** Where the gateway key was resolved from: Keywire vault (primary) or env. */
  keySource?: GatewayKeySource;
}

type TierCache = { online: boolean | null; at: number; error: string | undefined };
let statusCache: Record<'gateway' | 'local', TierCache> = {
  gateway: { online: null, at: 0, error: undefined },
  local: { online: null, at: 0, error: undefined },
};
const STATUS_TTL_MS = 10_000;

async function probeTier(id: 'gateway' | 'local', tier: JevTierConfig, now: number, force = false): Promise<JevTierStatus> {
  const slot = statusCache[id];
  if (!force && slot.online !== null && now - slot.at < STATUS_TTL_MS) {
    return { id, baseUrl: tier.baseUrl, model: tier.model, online: slot.online === true, error: slot.error };
  }
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tier.apiKey) headers.Authorization = `Bearer ${tier.apiKey}`;
    const res = await rawFetch(`${tier.baseUrl}/v1/models`, { method: 'GET', headers }, 3000);
    slot.online = res.ok;
    slot.at = now;
    slot.error = res.ok ? undefined : `GET /v1/models -> HTTP ${res.status}`;
  } catch (err: any) {
    slot.online = false;
    slot.at = now;
    slot.error = err?.message || 'unreachable';
  }
  return { id, baseUrl: tier.baseUrl, model: tier.model, online: slot.online === true, error: slot.error };
}

/** Probes both tiers (gateway + localjev). Reports honestly per tier. */
export async function jevStatus(force = false): Promise<JevStatus> {
  await ensureJevGatewayKey();
  const c = jevConfig();
  const now = Date.now();
  const [gateway, local] = await Promise.all([
    probeTier('gateway', c.gateway, now, force),
    probeTier('local', c.local, now, force),
  ]);
  return {
    configured: true,
    enabled: c.enabled,
    tiers: [gateway, local],
    online: gateway.online || local.online,
    checkedAt: now,
    keySource: gatewayKeySource,
  };
}

function authHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

async function rawFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface SystemOneInput {
  state: JevState;
  questions: Record<string, JevQuestion>;
  model?: string;
}

export interface JevUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface JevResult {
  ok: boolean;
  source: 'vercel' | 'localjev' | 'offline';
  model?: string;
  answers?: Record<string, JevAnswer>;
  usage?: JevUsage;
  latencyMs: number;
  error?: string;
  httpStatus?: number;
}

interface TierCallResult {
  ok: boolean;
  model?: string;
  answers?: Record<string, JevAnswer>;
  usage?: JevUsage;
  latencyMs: number;
  error?: string;
  httpStatus?: number;
}

/** One tier's POST /v1/systemone with transient-overload retry (429/529). */
async function postSystemOne(
  tier: JevTierConfig,
  input: SystemOneInput,
  timeoutMs: number,
  started: number,
): Promise<TierCallResult> {
  const endpoint = `${tier.baseUrl}/v1/systemone`;
  const body = { model: input.model ?? tier.model, state: input.state, questions: input.questions };
  const retryable = new Set([429, 529]);
  let lastStatus = 0;
  let lastError = '';

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(Math.min(300, 200 * attempt));
    try {
      const res = await rawFetch(endpoint, { method: 'POST', headers: authHeaders(tier.apiKey), body: JSON.stringify(body) }, timeoutMs);
      lastStatus = res.status;
      if (retryable.has(res.status)) {
        lastError = `HTTP ${res.status} (transient overload; retrying)`;
        continue;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        lastError = `POST ${endpoint} -> HTTP ${res.status}: ${text.slice(0, 200)}`;
        return { ok: false, latencyMs: Date.now() - started, error: lastError, httpStatus: res.status };
      }
      const data: any = await res.json();
      const answers: Record<string, JevAnswer> | undefined = data && typeof data.answers === 'object' && data.answers !== null ? data.answers : undefined;
      if (!answers) {
        return { ok: false, latencyMs: Date.now() - started, error: 'Jev response missing answers' };
      }
      const usage: JevUsage | undefined =
        data?.usage && typeof data.usage.input_tokens === 'number'
          ? { inputTokens: data.usage.input_tokens, outputTokens: Number(data.usage.output_tokens) || 0 }
          : undefined;
      return {
        ok: true,
        model: typeof data.model === 'string' ? data.model : tier.model,
        answers,
        usage,
        latencyMs: Date.now() - started,
      };
    } catch (err: any) {
      const aborted = err?.name === 'AbortError';
      lastError = aborted ? `request timed out after ${timeoutMs}ms` : (err?.message || 'request failed');
      if (!aborted) break;
    }
  }
  return { ok: false, latencyMs: Date.now() - started, error: lastError, httpStatus: lastStatus || undefined };
}

/**
 * One typed decision call with a two-tier fallback chain:
 *   tier 1 = Vercel AI Gateway TypeSafe lane (used when a key is configured),
 *   tier 2 = LocalJev on :8080 (no key needed).
 * A gateway failure falls through to localjev; only when BOTH fail is the result
 * `source:'offline'` — nothing is fabricated.
 */
export async function decideSystemOne(input: SystemOneInput): Promise<JevResult> {
  await ensureJevGatewayKey();
  const c = jevConfig();
  const started = Date.now();
  if (!jevEnabled()) {
    return {
      ok: false,
      source: 'offline',
      latencyMs: Date.now() - started,
      error: c.enabled ? 'no Jev tier configured' : 'Jev decision engine disabled (DEV_BRAIN_JEV_ENABLED=0)',
    };
  }

  if (c.gateway.apiKey) {
    const r = await postSystemOne(c.gateway, input, c.timeoutMs, started);
    if (r.ok) return { ...r, source: 'vercel' };
  }

  const local = await postSystemOne(c.local, input, c.timeoutMs, started);
  if (local.ok) return { ...local, source: 'localjev' };
  return { ...local, source: 'offline' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Decision-matrix advisory builder ───────────────────────────────────────

export interface MatrixAdvisory {
  state: JevState;
  questions: Record<string, JevQuestion>;
  options: WeightedDecisionOption[];
}

/**
 * Builds a compact Jev `state` + one `choice` question over the options of a
 * deterministic decision matrix. State is trimmed on purpose (Jev bills per
 * input token): option titles, deterministic weights, risk levels — no prose.
 */
export function decisionMatrixAdvisory(matrix: DecisionMatrixResult, optionLimit = 12): MatrixAdvisory {
  const options = matrix.options.slice(0, optionLimit);
  const state = {
    decisionTopic: matrix.decisionTopic.slice(0, 160),
    recommendedOptionId: matrix.recommendedOptionId,
    options: options.map((o) => ({
      id: o.id,
      title: o.title.slice(0, 80),
      weightPercentage: o.weightPercentage,
      riskLevel: o.riskLevel,
    })),
  };

  const criteria: Record<string, string> = {};
  for (const o of options) {
    criteria[o.id] = `${o.title.slice(0, 70)} (deterministic weight ${o.weightPercentage}%, ${o.riskLevel} risk)`;
  }
  // Jev requires 2-128 choice options; a single-option matrix must still pass.
  if (Object.keys(criteria).length < 2) criteria.defer = 'Defer / no action now';

  const questions: Record<string, JevQuestion> = {
    choose: {
      type: 'choice',
      instructions: 'Which option should be selected as the primary course of action?',
      criteria,
    },
  };

  return { state, questions, options };
}

export interface MatrixChoiceAdvisory {
  ok: boolean;
  source: 'vercel' | 'localjev' | 'offline';
  model?: string;
  recommendedOptionId?: string;
  recommendedTitle?: string;
  probability?: number;
  confidence?: number;
  usage?: JevUsage;
  latencyMs: number;
  error?: string;
}

export function buildMatrixChoiceAdvisory(result: JevResult, options: WeightedDecisionOption[]): MatrixChoiceAdvisory {
  if (!result.ok || !result.answers) {
    return { ok: false, source: 'offline', latencyMs: result.latencyMs, error: result.error };
  }
  const answer = result.answers.choose;
  let recommendedOptionId: string | undefined;
  let probability = 0;
  let confidence: number | undefined;
  if (answer && answer.type === 'choice') {
    recommendedOptionId = answer.choice;
    probability = answer.probabilities?.[answer.choice] ?? 0;
    confidence = answer.confidence;
  }
  const option = options.find((o) => o.id === recommendedOptionId);
  return {
    ok: true,
    source: result.source,
    model: result.model,
    recommendedOptionId,
    recommendedTitle: option?.title,
    probability,
    confidence,
    usage: result.usage,
    latencyMs: result.latencyMs,
  };
}