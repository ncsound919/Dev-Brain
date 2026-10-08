// dev-brain-mcp.ts — MCP (Model Context Protocol) stdio server for the Dev Brain
// deterministic decision engine.
//
// Purpose: let a harness (DSH, Axiom) use Dev Brain as a decision brain over
// stdio. Unlike Recourse and OpenHub, Dev Brain ships no MCP server — it is
// HTTP only — so this file is the bridge.
//
// Design notes:
//   * Pure Node, one JSON-RPC message per line on stdin/stdout, no SDK
//     dependency. Mirrors openhub-mcp.ts so the harness sees one transport.
//   * The deterministic matrix endpoints (/api/decide, /api/strategy/decide,
//     /api/repair/triage, /api/governance/evaluate) are LLM-free. They are the
//     cheap path and should be preferred when they answer the question.
//   * The JEV endpoints add a calibrated advisory from a local model
//     (LocalJev :8080) or the TypeSafe gateway. Dev Brain reports
//     source:'offline' rather than fabricating a recommendation, and this shim
//     surfaces that verbatim.
//   * Every failure is reported honestly. A refused call is never dressed up
//     as a decision.
//
// Smoke test:
//   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | npx tsx dev-brain-mcp.ts
//   echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'        | npx tsx dev-brain-mcp.ts

import readline from "node:readline";
import "dotenv/config";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_NAME = "dev-brain-decide";
const SERVER_VERSION = "1.0.0";

// Port note: Dev Brain's own default is 3000; Keywire owns :4700. 3450 is what
// Recourse's DEV_BRAIN_URL expects, so default here to keep every caller on the
// same instance.
const API = (process.env.DEV_BRAIN_API_URL || "http://127.0.0.1:3450").replace(/\/+$/, "");
const SECRET = process.env.DEV_BRAIN_API_SECRET || process.env.CRON_SECRET || "";

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

function respond(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function respondError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

function toolResult(content: string, isError = false): unknown {
  return { content: [{ type: "text", text: content }], isError };
}

const CANDIDATE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short name of the option being weighed." },
    description: { type: "string", description: "What this option is and why it is on the table." },
    weightPercentage: { type: "number", description: "Relative weight 0-100. Weights should sum to 100." },
    confidenceScore: { type: "number", description: "Your confidence in this option, 0-100." },
  },
  required: ["title"],
  additionalProperties: true,
} as const;

const DECIDE_PROPERTIES = {
  problem: { type: "string", description: "The decision to make, in plain language." },
  candidates: { type: "array", items: CANDIDATE_SCHEMA, description: "The options to weigh." },
  strategy: { type: "string", description: "Optional triage strategy hint passed through to Dev Brain." },
} as const;

export const TOOLS: ToolDef[] = [
  {
    name: "devbrain_health",
    description:
      "Dev Brain liveness and engine status. Reports the server's own health/status payload, whether the JEV decision engine is enabled, and which JEV tier (gateway or local LocalJev on :8080) is reachable. Call this first when a decision tool fails, to distinguish 'engine down' from 'question undecidable'.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "devbrain_jev_status",
    description:
      "Probe the JEV (System One) decision engine tiers. Returns per-tier configured/reachable/latency and the resolved gateway key source. source 'offline' means no JEV tier is usable; the deterministic matrix remains authoritative in that case.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "devbrain_decide",
    description:
      "Deterministic decision matrix over a set of candidates. LLM-free and cheap — prefer this over devbrain_decide_jev when the question is 'which option wins on stated criteria'. Returns the weighted matrix with first-principles justification, verdict tags, and risk levels.",
    inputSchema: {
      type: "object",
      properties: { ...DECIDE_PROPERTIES },
      additionalProperties: false,
    },
  },
  {
    name: "devbrain_decide_jev",
    description:
      "Decision matrix plus a calibrated JEV advisory over the same options. The deterministic matrix stays authoritative; Jev adds a ranked recommendation with probabilities and confidence. Requires a problem and/or candidates. Returns source 'offline' honestly when no JEV tier answers.",
    inputSchema: {
      type: "object",
      properties: { ...DECIDE_PROPERTIES },
      additionalProperties: false,
    },
  },
  {
    name: "devbrain_decide_jev_raw",
    description:
      "Raw JEV passthrough for autonomy gating. Supply your own state string and a map of choice/noul/score questions (e.g. 'may I stop this cluster?') without going through the intake/matrix model. State is capped at 20000 chars. Returns calibrated answers or source 'offline' — never a fabricated recommendation.",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "The situation to reason over, max 20000 chars." },
        questions: {
          type: "object",
          description:
            "Map of question name -> { type: 'choice'|'noul'|'score', instructions, criteria }. 'choice' needs criteria as an option->description map; 'noul' takes { true, false } criteria; 'score' takes an ordered criteria array.",
        },
      },
      required: ["state", "questions"],
      additionalProperties: false,
    },
  },
  {
    name: "devbrain_strategy_decide",
    description:
      "Strategy-team adapter: ranks scout proposals by 90-day revenue-engine fit and moat. Deterministic, LLM-free. Use for 'which venture/proposal should we pursue' questions.",
    inputSchema: {
      type: "object",
      properties: {
        problem: { type: "string", description: "The strategy question, if not carried by the proposals." },
        proposals: { type: "array", items: CANDIDATE_SCHEMA, description: "The proposals or ventures to rank." },
        strategy: { type: "string", description: "Optional triage strategy hint." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "devbrain_repair_triage",
    description:
      "Triage a set of failures into a repair priority order. Deterministic, LLM-free. Use when deciding what to fix first across many candidate failures.",
    inputSchema: {
      type: "object",
      properties: {
        problem: { type: "string", description: "What is being repaired." },
        failures: { type: "array", items: CANDIDATE_SCHEMA, description: "The failure candidates to triage." },
        strategy: { type: "string", description: "Optional triage strategy hint." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "devbrain_governance_evaluate",
    description:
      "Evaluate a proposal or action against governance policy. Deterministic, LLM-free. Use as a gate before an autonomous agent commits an externally visible change.",
    inputSchema: {
      type: "object",
      properties: {
        problem: { type: "string", description: "The action being evaluated." },
        candidates: { type: "array", items: CANDIDATE_SCHEMA, description: "The options under governance review." },
        strategy: { type: "string", description: "Optional triage strategy hint." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "devbrain_genomes",
    description:
      "List the operator genome library (leader decision genomes across Dev, Business, Marketing, Financial and Science domains). Use to discover what decision playbooks Dev Brain already knows before inventing a new one.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "devbrain_sectors",
    description:
      "List the sector definitions Dev Brain can reason across, with their ids, names and icons. Use to map a business question onto the right sector before deciding.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    // Only the guarded raw endpoint enforces this; sending it everywhere is
    // harmless and keeps one code path.
    if (SECRET) headers.Authorization = `Bearer ${SECRET}`;
    const res = await fetch(`${API}${path}`, { ...init, headers, signal: ctrl.signal });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      /* non-JSON body, surfaced as-is */
    }
    if (!res.ok) {
      const detail = typeof body === "object" && body && "error" in body ? (body as { error: unknown }).error : body;
      throw new Error(`Dev Brain ${path} -> HTTP ${res.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

const json = (v: unknown): string => JSON.stringify(v, null, 2);

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "devbrain_health": {
      const [health, status, jev] = await Promise.allSettled([
        call("/api/health"),
        call("/api/status"),
        call("/api/jev/status"),
      ]);
      const part = (r: PromiseSettledResult<unknown>) =>
        r.status === "fulfilled" ? r.value : { error: r.reason instanceof Error ? r.reason.message : String(r.reason) };
      return toolResult(
        json({
          api: API,
          health: part(health),
          status: part(status),
          jev: part(jev),
        }),
      );
    }
    case "devbrain_jev_status":
      return toolResult(json(await call("/api/jev/status")));

    case "devbrain_decide":
      return toolResult(json(await call("/api/decide", { method: "POST", body: json(args) })));

    case "devbrain_decide_jev":
      return toolResult(json(await call("/api/decide/jev", { method: "POST", body: json(args) })));

    case "devbrain_decide_jev_raw":
      return toolResult(json(await call("/api/decide/jev/raw", { method: "POST", body: json(args) })));

    case "devbrain_strategy_decide": {
      const body: Record<string, unknown> = { ...args };
      if (Array.isArray(body.proposals) && !body.candidates) body.candidates = body.proposals;
      return toolResult(json(await call("/api/strategy/decide", { method: "POST", body: json(body) })));
    }
    case "devbrain_repair_triage": {
      const body: Record<string, unknown> = { ...args };
      if (Array.isArray(body.failures) && !body.candidates) body.candidates = body.failures;
      return toolResult(json(await call("/api/repair/triage", { method: "POST", body: json(body) })));
    }
    case "devbrain_governance_evaluate": {
      const body: Record<string, unknown> = { ...args };
      if (Array.isArray(body.candidates) && !body.tools) body.tools = body.candidates;
      return toolResult(json(await call("/api/governance/evaluate", { method: "POST", body: json(body) })));
    }
    case "devbrain_genomes":
      return toolResult(json(await call("/api/genomes")));

    case "devbrain_sectors":
      return toolResult(json(await call("/api/sectors")));

    default:
      return toolResult(`Unknown tool "${name}".`, true);
  }
}

async function handleRequest(req: JsonRpcRequest): Promise<JsonRpcResponse> {
  const id = req.id ?? null;
  const params = (req.params ?? {}) as Record<string, unknown>;
  try {
    switch (req.method) {
      case "initialize":
        return respond(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        });
      case "notifications/initialized":
      case "notifications/cancelled":
        return respond(id, {});
      case "ping":
        return respond(id, {});
      case "tools/list":
        return respond(id, { tools: TOOLS });
      case "tools/call": {
        if (typeof params.name !== "string") throw new Error("tools/call requires params.name");
        try {
          return respond(id, await callTool(params.name, (params.arguments ?? {}) as Record<string, unknown>));
        } catch (err) {
          // Surface the real reason as a tool error result; a thrown JSON-RPC
          // error would read to the model as a broken server, not a bad call.
          const message = err instanceof Error ? err.message : String(err);
          return respond(id, toolResult(message, true));
        }
      }
      default:
        return respondError(id, -32601, "Method not found", { method: req.method });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return respondError(id, -32603, message || "Internal error", { method: req.method });
  }
}

function main(): void {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  // Tool calls are async; a host that closes stdin right after writing a batch
  // must not lose the replies still in flight.
  const inFlight = new Set<Promise<void>>();
  let stdinClosed = false;

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let req: JsonRpcRequest;
    try {
      req = JSON.parse(trimmed) as JsonRpcRequest;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(JSON.stringify(respondError(null, -32700, "Parse error", { message })) + "\n");
      return;
    }
    if (req.jsonrpc !== "2.0" || typeof req.method !== "string") {
      process.stdout.write(JSON.stringify(respondError(req.id ?? null, -32600, "Invalid Request")) + "\n");
      return;
    }
    const task = handleRequest(req).then((res) => {
      if (req.id !== undefined && req.id !== null) process.stdout.write(JSON.stringify(res) + "\n");
    });
    inFlight.add(task);
    void task.finally(() => {
      inFlight.delete(task);
      if (stdinClosed && inFlight.size === 0) process.exit(0);
    });
  });

  rl.on("close", () => {
    stdinClosed = true;
    if (inFlight.size === 0) process.exit(0);
  });
}

const isMain = process.argv[1] && /dev-brain-mcp\.(ts|cjs|js)$/.test(process.argv[1]);
if (isMain) main();
