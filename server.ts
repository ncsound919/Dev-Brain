import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { ALL_LEADER_GENOMES } from "./src/data/genomes";
import { SECTORS } from "./src/data/sectors";
import { BUILT_IN_DECISION_TREES } from "./src/data/decisionTrees";
import { runIntake, IntakeRequest, buildDecisionMatrix } from "./src/engine/intakeScorer";
import { AgentIntegrationEngine } from "./src/engine/agentIntegrationEngine";
import type { AgentActionPayload, DecisionDomain } from "./src/types";
import {
  jevStatus,
  jevEnabled,
  decideSystemOne,
  decisionMatrixAdvisory,
  buildMatrixChoiceAdvisory,
} from "./src/engine/jevClient";

// ─── Local-first LLM shim ─────────────────────────────────────────────────────
// All handlers below used to call Gemini directly and hardcode gemini-3.7-flash.
// They now go through createLLM(), which calls the local OpenAI-compatible
// model (MiniCPM5-1B "Fable" via llama.cpp, alias minicpm5-fable) first and
// only falls back to Gemini when the local server is unreachable or returns
// unusable output. Set DISABLE_LOCAL_LLM=1 to force the old Gemini-only behaviour.
const LOCAL_LLM_BASE_URL = (
  process.env.LOCAL_LLM_BASE_URL ||
  process.env.OLLAMA_BASE_URL ||
  "http://127.0.0.1:11434"
).replace(/\/+$/, "");
const LOCAL_LLM_MODEL =
  process.env.LOCAL_LLM_MODEL || process.env.OLLAMA_MODEL || "minicpm5-fable";
const LOCAL_LLM_TIMEOUT_MS = Number(process.env.LOCAL_LLM_TIMEOUT_MS) || 300_000;

function contentsToPrompt(contents: any): string {
  if (typeof contents === "string") return contents;
  const parts = contents?.parts;
  if (Array.isArray(parts)) return parts.map((p: any) => p?.text ?? "").join("\n");
  return String(contents ?? "");
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  if (start === -1 || end === -1 || end < start) {
    throw new Error("local model did not return parseable JSON");
  }
  const slice = candidate.slice(start, end + 1);
  JSON.parse(slice);
  return slice;
}

async function localGenerate(
  prompt: string,
  system: string | undefined,
  temperature: number,
): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOCAL_LLM_TIMEOUT_MS);
  try {
    const response = await fetch(`${LOCAL_LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_LLM_MODEL,
        messages,
        stream: false,
        temperature,
        // Skip the reasoning pass: the Fable MiniCPM otherwise spends the whole
        // budget on reasoning_content (≈7× slower, often empty `content`).
        // Set LOCAL_LLM_THINK=1 to keep thinking enabled.
        ...(process.env.LOCAL_LLM_THINK === "1"
          ? {}
          : { chat_template_kwargs: { enable_thinking: false } }),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`local LLM HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
    }
    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("local LLM returned empty content");
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

function createLLM() {
  const apiKey = process.env.GEMINI_API_KEY;
  const useLocal = process.env.DISABLE_LOCAL_LLM !== "1";
  const gemini = () =>
    new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });

  return {
    models: {
      async generateContent({ model, contents, config }: any) {
        const prompt = contentsToPrompt(contents);
        const jsonMode = config?.responseMimeType === "application/json";
        if (useLocal) {
          try {
            let text = await localGenerate(prompt, config?.systemInstruction, config?.temperature ?? 0.7);
            if (jsonMode) text = extractJson(text);
            return { text };
          } catch (err: any) {
            console.warn("[dev-brain] local LLM failed, falling back to Gemini:", err?.message ?? err);
          }
        }
        if (!apiKey) {
          throw new Error("Local LLM unavailable and GEMINI_API_KEY is not configured.");
        }
        return gemini().models.generateContent({
          model: process.env.GEMINI_MODEL || model || "gemini-3.7-flash",
          contents,
          config,
        });
      },
      async generateContentStream({ model, contents, config }: any) {
        const prompt = contentsToPrompt(contents);
        if (useLocal) {
          try {
            const text = await localGenerate(prompt, config?.systemInstruction, config?.temperature ?? 0.7);
            return (async function* () {
              yield { text };
            })();
          } catch (err: any) {
            console.warn("[dev-brain] local LLM stream failed, falling back to Gemini:", err?.message ?? err);
          }
        }
        if (!apiKey) {
          throw new Error("Local LLM unavailable and GEMINI_API_KEY is not configured.");
        }
        return gemini().models.generateContentStream({
          model: process.env.GEMINI_MODEL || model || "gemini-3.7-flash",
          contents,
          config,
        });
      },
    },
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || "127.0.0.1";

  app.use(express.json());

  // System Health & Telemetry Diagnostics
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "dev-brain",
      version: "1.0.0",
    });
  });

  app.get("/api/status", (_req, res) => {
    const leaderCount = Object.keys(ALL_LEADER_GENOMES).length;
    const sectorCount = Object.keys(SECTORS).length;
    const decisionTreeCount = Object.keys(BUILT_IN_DECISION_TREES).length;
    res.json({
      status: "operational",
      version: "1.0.0",
      stats: {
        leaderGenomes: leaderCount,
        activeSectors: sectorCount,
        decisionTrees: decisionTreeCount,
      },
      backends: {
        deterministicEngine: true,
        local: process.env.DISABLE_LOCAL_LLM !== "1",
        localModel: LOCAL_LLM_MODEL,
        localBaseUrl: LOCAL_LLM_BASE_URL,
        gemini: Boolean(process.env.GEMINI_API_KEY),
        ollama: Boolean(process.env.OLLAMA_HOST || "http://localhost:11434"),
      },
      environment: {
        host: HOST,
        port: PORT,
        nodeEnv: process.env.NODE_ENV || "development",
      }
    });
  });

  // API Routes — core deterministic engine (no LLM, no network)
  app.post("/api/intake", (req, res) => {
    try {
      const body = (req.body || {}) as Partial<IntakeRequest>;
      if (!Array.isArray(body.tools)) {
        return res.status(400).json({ error: "tools must be a non-empty array of tool descriptors." });
      }
      const result = runIntake({ tools: body.tools, strategy: body.strategy, problem: body.problem });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Intake scoring failed." });
    }
  });

  app.post("/api/decide", (req, res) => {
    try {
      const body = (req.body || {}) as Partial<IntakeRequest> & { candidates?: IntakeRequest['tools'] };
      const candidates = Array.isArray(body.candidates)
        ? body.candidates
        : Array.isArray(body.tools)
          ? body.tools
          : [];
      if (!body.problem && candidates.length === 0) {
        return res.status(400).json({ error: "provide a problem and/or candidates to decide on." });
      }
      const matrix = buildDecisionMatrix({ tools: candidates, strategy: body.strategy, problem: body.problem });
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Decision matrix generation failed." });
    }
  });

  // -- TypeSafe Jev (System One) decision advisory -------------------------
  // The deterministic matrix stays authoritative; Jev adds a calibrated
  // choice advisory over the same options. Gateway unreachable / no key =>
  // jev.source is 'offline' (never a fabricated recommendation).
  app.get("/api/jev/status", async (_req, res) => {
    try {
      const status = await jevStatus();
      res.json({ success: true, jev: status, enabled: jevEnabled() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Jev status failed." });
    }
  });

  app.post("/api/decide/jev", async (req, res) => {
    try {
      const body = (req.body || {}) as Partial<IntakeRequest> & { candidates?: IntakeRequest['tools'] };
      const candidates = Array.isArray(body.candidates)
        ? body.candidates
        : Array.isArray(body.tools)
          ? body.tools
          : [];
      if (!body.problem && candidates.length === 0) {
        return res.status(400).json({ error: "provide a problem and/or candidates to decide on." });
      }
      const matrix = buildDecisionMatrix({ tools: candidates, strategy: body.strategy, problem: body.problem });
      const advisory = decisionMatrixAdvisory(matrix);
      const result = await decideSystemOne({ state: advisory.state, questions: advisory.questions });
      const jev = buildMatrixChoiceAdvisory(result, advisory.options);
      res.json({ matrix, jev, decidedAt: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Jev decision failed." });
    }
  });

  // -- Raw Jev passthrough (Ecosystem Control Center autonomy gate) ---------
  // Lets a caller supply its own Jev state + questions (e.g. "may I stop
  // cluster X?") without coupling to the IntakeRequest/matrix model. Thin
  // passthrough to decideSystemOne; returns calibrated answers or source
  // 'offline' — never a fabricated recommendation.
  app.post("/api/decide/jev/raw", async (req, res) => {
    try {
      const secret = process.env.DEV_BRAIN_API_SECRET || process.env.CRON_SECRET;
      if (secret) {
        const auth = req.headers.authorization || "";
        if (auth !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized" });
      }
      const body = (req.body || {}) as { state?: string; questions?: unknown };
      if (typeof body.state === "string" && body.state.length > 20000) {
        return res.status(413).json({ error: "state too large (max 20000 chars)." });
      }
      if (typeof body.state !== "string" || !body.state || !body.questions || typeof body.questions !== "object") {
        return res.status(400).json({ error: "state (string) and questions (object) are required." });
      }
      const result = await decideSystemOne({ state: body.state, questions: body.questions as any });
      res.json({ ...result, decidedAt: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Jev raw decision failed." });
    }
  });

  // -- Strategy Team adapter: ventures / proposals → deterministic ranking --
  // Draymond's strategy-team calls this to weight scout proposals by 90-day
  // revenue-engine fit + moat before persisting ventures. Deterministic alias
  // of /api/decide with a strategy-specific problem template when none supplied.
  app.post("/api/strategy/decide", (req, res) => {
    try {
      const body = (req.body || {}) as Partial<IntakeRequest> & { candidates?: IntakeRequest['tools']; proposals?: unknown[] };
      const rawCandidates = Array.isArray(body.candidates)
        ? body.candidates
        : Array.isArray(body.tools)
          ? body.tools
          : Array.isArray(body.proposals)
            ? (body.proposals as IntakeRequest['tools'])
            : [];
      const problem = body.problem || "Strategy venture ranking: 90-day six-figure revenue engine fit (E1-platform, E2-b2b, E3-tooling, E4-vertical) + durable moat and execution speed.";
      if (!problem && rawCandidates.length === 0) {
        return res.status(400).json({ error: "provide a problem and/or proposals to rank." });
      }
      const matrix = buildDecisionMatrix({ tools: rawCandidates, strategy: body.strategy || 'balanced_pareto', problem });
      (matrix as unknown as Record<string, unknown>)._adapter = 'strategy';
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Strategy decide failed." });
    }
  });

  // -- Marketing adapter: campaign / channel / content mix → weighted allocation --
  // Draymond's marketing path and the SMD call this to allocate budget / effort
  // across channels (Shlink, Postiz, Listmonk, Twenty, Formbricks, social).
  app.post("/api/marketing/decide", (req, res) => {
    try {
      const body = (req.body || {}) as Partial<IntakeRequest> & { candidates?: IntakeRequest['tools']; channels?: unknown[]; campaigns?: unknown[] };
      const rawCandidates = Array.isArray(body.candidates)
        ? body.candidates
        : Array.isArray(body.channels)
          ? (body.channels as IntakeRequest['tools'])
          : Array.isArray(body.campaigns)
            ? (body.campaigns as IntakeRequest['tools'])
            : Array.isArray(body.tools)
              ? body.tools
              : [];
      const problem = body.problem || "Marketing mix allocation: weight channels and campaigns by attributable revenue, CAC payback, and durable audience ownership (list/CRM) vs rented reach.";
      if (!problem && rawCandidates.length === 0) {
        return res.status(400).json({ error: "provide a problem and/or channels/campaigns to weight." });
      }
      const matrix = buildDecisionMatrix({ tools: rawCandidates, strategy: body.strategy || 'capital_efficiency', problem });
      (matrix as unknown as Record<string, unknown>)._adapter = 'marketing';
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Marketing decide failed." });
    }
  });

  // -- Governance gate: proposed agent action → deterministic verdict --
  // The real policy brain: AgentIntegrationEngine runs hard guardrails +
  // circuit breakers + the domain decision tree (e.g. public_communication's
  // broadcast/refund gate) and returns APPROVED / REJECTED /
  // ESCALATE_TO_FOUNDER / CONDITIONAL_APPROVAL with a full trace path.
  // Draymond's marketing team calls this to gate every publish.
  app.post("/api/governance/evaluate", (req, res) => {
    try {
      const body = (req.body || {}) as Partial<AgentActionPayload>;
      if (!body.actionType) {
        return res.status(400).json({ error: "provide actionType (e.g. 'public_communication')." });
      }
      const payload: AgentActionPayload = {
        agentId: body.agentId || "draymond-marketing-team",
        agentName: body.agentName || "Overlay365 Marketing Team",
        actionType: body.actionType as DecisionDomain,
        actionSummary: body.actionSummary || body.intent || "Marketing action",
        parameters: body.parameters ?? {},
        intent: body.intent || "Governance evaluation",
        proposedExecutionTime: body.proposedExecutionTime,
        callerEnvironment: body.callerEnvironment ?? "production",
      };
      const verdict = AgentIntegrationEngine.evaluateAction(payload);
      res.json({ _adapter: "governance", verdict, decidedAt: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Governance evaluation failed." });
    }
  });

  // -- Repair triage adapter: failures / monitors → risk-tiered repair ordering --
  // The repair-team and brain-decision call this to get a deterministic,
  // auditable ordering of hiccups before dispatching fixes. Alias of /api/decide
  // with a repair-specific problem template.
  app.post("/api/repair/triage", (req, res) => {
    try {
      const body = (req.body || {}) as Partial<IntakeRequest> & { candidates?: IntakeRequest['tools']; failures?: unknown[]; hiccups?: unknown[] };
      const rawCandidates = Array.isArray(body.failures)
        ? (body.failures as IntakeRequest['tools'])
        : Array.isArray(body.hiccups)
          ? (body.hiccups as IntakeRequest['tools'])
          : Array.isArray(body.candidates)
            ? body.candidates
            : Array.isArray(body.tools)
              ? body.tools
              : [];
      const problem = body.problem || "Repair triage: order failing jobs and down monitors by blast radius, reversibility, and time-to-restore. Cheapest safe win first; irreversible / customer-facing last without human gate.";
      if (!problem && rawCandidates.length === 0) {
        return res.status(400).json({ error: "provide a problem and/or failures to triage." });
      }
      const matrix = buildDecisionMatrix({ tools: rawCandidates, strategy: body.strategy || 'risk_containment', problem });
      (matrix as unknown as Record<string, unknown>)._adapter = 'repair';
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Repair triage failed." });
    }
  });

  // -- Brain fusion: Draymond fans a decision to BOTH brains and merges --
  // Lets callers get Dev-Brain's deterministic matrix PLUS the deterministic
  // brain's (3210) skill/task recommendation in one round trip when both are up.
  // Best-effort: if the Python brain is down, still returns Dev-Brain's matrix.
  app.post("/api/fusion/decide", async (req, res) => {
    try {
      const body = (req.body || {}) as Partial<IntakeRequest> & { candidates?: IntakeRequest['tools'] };
      const candidates = Array.isArray(body.candidates)
        ? body.candidates
        : Array.isArray(body.tools) ? body.tools : [];
      const problem = body.problem || "Cross-brain fusion decision: deterministic matrix (Dev-Brain) + skill/task execution (deterministic brain 3210).";
      const matrix = buildDecisionMatrix({ tools: candidates, strategy: body.strategy, problem });

      let brainSkill: unknown = null;
      const brainUrl = process.env.BRAIN_URL || "http://127.0.0.1:3210";
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 4000);
        const r = await fetch(`${brainUrl.replace(/\/+$/, '')}/task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: problem, candidates: candidates.slice(0, 5) }),
          signal: controller.signal,
        });
        clearTimeout(t);
        if (r.ok) brainSkill = await r.json();
      } catch { /* brain down — still return Dev-Brain matrix */ }

      res.json({ devBrain: matrix, deterministicBrain: brainSkill, fusedAt: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Fusion decide failed." });
    }
  });

  // -- Sectors & genomes catalog (so Draymond/marketing can enumerate brains) --
  app.get("/api/sectors", (_req, res) => {
    const sectors = Object.values(SECTORS).map(s => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      councils: s.councils,
      leaderCount: s.leaderCount,
      description: s.description,
    }));
    res.json({ sectors, totalLeaders: Object.keys(ALL_LEADER_GENOMES).length });
  });

  app.get("/api/genomes", (req, res) => {
    const sector = (req.query.sector as string) || 'all';
    const pool = sector === 'all'
      ? Object.entries(ALL_LEADER_GENOMES)
      : Object.entries(ALL_LEADER_GENOMES).filter(([, g]) => g.sector === sector);
    res.json({
      sector,
      count: pool.length,
      genomes: pool.map(([key, g]) => ({ key, id: g.id, name: g.name, sector: g.sector, subBrain: g.subBrain, role: g.role, voteScope: g.voteScope })),
    });
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, stream, taskType } = req.body;
      const ai = createLLM();

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.7-flash",
          contents: prompt,
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
             res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
        });
        res.json({ text: response.text });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during generation." });
    }
  });

  app.post("/api/gemini/weigh", async (req, res) => {
    try {
      const { topic, context, candidateOptions } = req.body;
      
      const ai = createLLM();

      const prompt = `You are an elite tactical decision engine. Analyze the following decision topic and context:
TOPIC: ${topic}
CONTEXT: ${context}
${candidateOptions && candidateOptions.length > 0 ? `PRE-SPECIFIED CANDIDATE OPTIONS TO EVALUATE:\n${candidateOptions.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}` : ''}

TASK:
1. Provide 2 to 4 distinct decision options.
2. Assign an exact percentage weight (0-100%) to each option reflecting its probabilistic superiority and strategic leverage. The sum of all percentage weights across all options MUST EQUAL EXACTLY 100%.
3. For EACH option, provide 3 to 4 detailed, bulleted PROS (advantages, upside, moat) and 3 to 4 detailed CONS (risks, costs, downsides, failure modes).
4. Provide a mitigation strategy for the cons, risk level (LOW, MEDIUM, HIGH, CRITICAL), expected ROI, and numeric scores (0-100) for feasibility, upsidePotential, safetyFloor, executionSpeed, capitalEfficiency.
5. Return the JSON response matching the provided schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a deterministic JSON-only decision matrix generator. You only output raw JSON conforming exactly to the requested schema.",
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decisionTopic: { type: Type.STRING },
              synthesisRationale: { type: Type.STRING },
              tradeOffSummary: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    weightPercentage: { type: Type.NUMBER },
                    confidenceScore: { type: Type.NUMBER },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    riskLevel: { type: Type.STRING },
                    expectedROI: { type: Type.STRING },
                    timeToValue: { type: Type.STRING },
                    recommended: { type: Type.BOOLEAN },
                    verdictTag: { type: Type.STRING },
                    mitigationStrategy: { type: Type.STRING },
                    supportingLeaders: { type: Type.ARRAY, items: { type: Type.STRING } },
                    scores: {
                      type: Type.OBJECT,
                      properties: {
                        feasibility: { type: Type.NUMBER },
                        upsidePotential: { type: Type.NUMBER },
                        safetyFloor: { type: Type.NUMBER },
                        executionSpeed: { type: Type.NUMBER },
                        capitalEfficiency: { type: Type.NUMBER }
                      },
                      required: ["feasibility", "upsidePotential", "safetyFloor", "executionSpeed", "capitalEfficiency"]
                    }
                  },
                  required: ["id", "title", "description", "weightPercentage", "confidenceScore", "pros", "cons", "riskLevel", "expectedROI", "timeToValue", "recommended", "verdictTag", "mitigationStrategy", "supportingLeaders", "scores"]
                }
              }
            },
            required: ["decisionTopic", "synthesisRationale", "tradeOffSummary", "options"]
          }
        }
      });

      const text = response.text;
      if (!text) {
         throw new Error("No text response from Gemini");
      }

      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred while generating the decision matrix." });
    }
  });

  app.post("/api/gemini/opponent", async (req, res) => {
    try {
      const { sector } = req.body;
      const ai = createLLM();
      const prompt = `You are a strategic sports and business simulation engine. 
Generate an Opponent Digital Twin for the following sector/context: ${sector}

Output exactly JSON matching this schema:
{
  "id": "string",
  "name": "string",
  "type": "DEFENSIVE_SCHEME" or "MARKET_COMPETITOR",
  "aggressiveness": number (0 to 1),
  "adaptability": number (0 to 1),
  "historicalTendencies": [
    { "trigger": "string", "response": "string", "probability": number (0 to 1) }
  ]
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              aggressiveness: { type: Type.NUMBER },
              adaptability: { type: Type.NUMBER },
              historicalTendencies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    trigger: { type: Type.STRING },
                    response: { type: Type.STRING },
                    probability: { type: Type.NUMBER }
                  },
                  required: ["trigger", "response", "probability"]
                }
              }
            },
            required: ["id", "name", "type", "aggressiveness", "adaptability", "historicalTendencies"]
          }
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/opponent/simulate", async (req, res) => {
    try {
      const { move, twin } = req.body;
      const ai = createLLM();
      const prompt = `Simulate a scrimmage.
Our Move: ${move}
Opponent Twin: ${JSON.stringify(twin)}

Generate 2-3 likely counter-moves the opponent will make.
Return JSON array of objects: [{ "moveName": "string", "probability": number (0 to 1), "impactOnOurSuccess": number (-1 to 1), "description": "string" }]`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                moveName: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                impactOnOurSuccess: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["moveName", "probability", "impactOnOurSuccess", "description"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/genome/mutate", async (req, res) => {
    try {
      const { baseStrategyName, generations } = req.body;
      const ai = createLLM();
      const prompt = `Run a multi-agent evolutionary simulation for strategy: "${baseStrategyName}" over ${generations} generations.
Start with base speed/risk/capital/innovation at 50. Mutate incrementally. 
Return JSON array of generation objects, each containing:
id (string), generation (number), fitnessScore (0-100), traits (speed, risk, capitalEfficiency, innovation - all 0-100), and mutationLog (string describing the change).
Ensure exactly ${generations + 1} objects (Generation 0 up to Generation ${generations}).`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                generation: { type: Type.NUMBER },
                fitnessScore: { type: Type.NUMBER },
                traits: {
                  type: Type.OBJECT,
                  properties: {
                    speed: { type: Type.NUMBER },
                    risk: { type: Type.NUMBER },
                    capitalEfficiency: { type: Type.NUMBER },
                    innovation: { type: Type.NUMBER }
                  },
                  required: ["speed", "risk", "capitalEfficiency", "innovation"]
                },
                mutationLog: { type: Type.STRING }
              },
              required: ["id", "generation", "fitnessScore", "traits", "mutationLog"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/fatigue", async (req, res) => {
    try {
      const { complexityScore, resourceAllocation, timeHorizonMonths } = req.body;
      const ai = createLLM();
      const prompt = `Simulate fatigue drift over ${timeHorizonMonths} months for a system with complexity score ${complexityScore}/100 and resource allocation ${resourceAllocation}/100.
Return a JSON array of objects representing each month. Each object must have:
month (number), cognitiveLoad (0-100), capitalBurn (0-100), structuralIntegrity (0-100).
Ensure exactly ${timeHorizonMonths} objects. Start with structuralIntegrity near 100, and gracefully degrade it as cognitiveLoad and capitalBurn rise.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.NUMBER },
                cognitiveLoad: { type: Type.NUMBER },
                capitalBurn: { type: Type.NUMBER },
                structuralIntegrity: { type: Type.NUMBER }
              },
              required: ["month", "cognitiveLoad", "capitalBurn", "structuralIntegrity"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 5 / path-to-regexp v8 rejects the bare '*'; use a version-agnostic
    // GET fallback so unknown SPA routes (other than already-static ones) get
    // index.html instead of crashing on a PathError.
    app.use((req, res, next) => {
      if (req.method === 'GET') {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[dev-brain] Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
