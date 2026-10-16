import {
  OllamaConfig,
  OllamaModelInfo,
  OllamaReasoningRequest,
  OllamaReasoningResponse,
  DecisionMatrixResult,
  WeightedDecisionOption
} from '../types';
import { DecisionMatrixEngine } from './decisionMatrixEngine';

/**
 * Defaults point at the runtime that is ACTUALLY on this machine.
 *
 * The previous defaults were `http://127.0.0.1:11434` (Ollama) and
 * `qwen3.5-2b` (a "Fable MiniCPM" alias). Nothing listens on :11434 here, and
 * the model on disk is Phi-4-mini-instruct served by llama.cpp on :8091. The
 * defaults are now the live llama.cpp endpoint, overridable with
 * LOCAL_LLM_BASE_URL / LOCAL_LLM_MODEL the same way the server side is.
 */
const DEFAULT_BASE_URL =
  (typeof process !== 'undefined' && process.env?.LOCAL_LLM_BASE_URL) ||
  'http://127.0.0.1:8091';

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: DEFAULT_BASE_URL.replace(/\/+$/, ''),
  selectedModel:
    (typeof process !== 'undefined' && process.env?.LOCAL_LLM_MODEL) ||
    'C:\\Users\\User\\Downloads\\BUSINESS\\INFRASTRUCTURE\\model-router\\models\\Phi-4-mini-instruct.Q8_0.gguf',
  temperature: 0.3,
  topP: 0.9,
  systemPrompt: 'You are an expert executive decision analyst and tactical reasoning engine. When analyzing choices, provide rigorous percentage-weighted evaluations with detailed pros and cons.',
  contextLength: 4096,
  stream: false,
  autoWeighDecisions: true,
  isConnected: false,
  isChecking: false,
  availableModels: []
};

/**
 * Short label for display only.
 *
 * llama.cpp reports the GGUF's full Windows path as the model id, so a raw
 * render puts a 90-character path in a <select>. This reduces it to the
 * filename for display; `name` and `model` stay the real id, because that is
 * what a chat request has to send. This is presentation, not invention — the
 * id itself is never rewritten.
 */
export function modelDisplayName(id: string): string {
  if (!id) return '';
  const slash = Math.max(id.lastIndexOf('/'), id.lastIndexOf('\\'));
  return slash >= 0 ? id.slice(slash + 1) : id;
}

export class OllamaClient {
  private config: OllamaConfig;

  constructor(initialConfig: Partial<OllamaConfig> = {}) {
    this.config = { ...DEFAULT_OLLAMA_CONFIG, ...initialConfig };
  }

  public getConfig(): OllamaConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<OllamaConfig>): OllamaConfig {
    this.config = { ...this.config, ...newConfig };
    return this.getConfig();
  }

  /**
   * Discover the models that are ACTUALLY running.
   *
   * This used to fabricate a one-entry list — a model named whatever
   * `selectedModel` happened to be, stamped `family: minicpm5`,
   * `parameter_size: 2B`, `Q4_K_M`, and `isConnected: true`, with no network
   * request made at all. That is why the Hub read "1 models detected —
   * qwen3.5-2b (2B)" while the machine was serving Phi-4-mini on :8091: the
   * inventory was invented, not read. A UI that cannot be wrong is a UI that
   * cannot be right, and it will keep agreeing with whatever stale alias is
   * left in the config.
   *
   * It now reads a real `/v1/models` endpoint. When that fails it reports
   * `connected: false` with the real reason, because "unreachable" and
   * "running Phi-4" are different facts and the Hub must be able to tell them.
   */
  public async checkConnection(): Promise<{
    connected: boolean;
    models: OllamaModelInfo[];
    error?: string;
  }> {
    this.config = { ...this.config, isChecking: true, connectionError: undefined };

    const base = (this.config.baseUrl || DEFAULT_OLLAMA_CONFIG.baseUrl).replace(/\/+$/, '');
    const timeout = AbortSignal.timeout(5000);

    let models: OllamaModelInfo[] = [];
    let error: string | undefined;

    try {
      const res = await fetch(`${base}/v1/models`, { signal: timeout });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${base}/v1/models`);
      const body: any = await res.json();
      const list: any[] = Array.isArray(body?.models) ? body.models : [];

      models = list.map((m) => ({
        name: String(m?.name ?? m?.model ?? ''),
        model: String(m?.model ?? m?.name ?? ''),
        // Use the server's own values. `size` may be empty; do not invent one.
        modified_at: String(m?.modified_at ?? ''),
        size: Number(m?.size ?? 0),
        digest: String(m?.digest ?? ''),
        details: {
          // llama.cpp reports the GGUF path as the model id and supplies no
          // details block. Absence must stay absent rather than become a guess.
          format: m?.details?.format ?? 'gguf',
          family: m?.details?.family ?? '',
          parameter_size: m?.details?.parameter_size ?? '',
          quantization_level: m?.details?.quantization_level ?? '',
        },
      })).filter((m) => m.name);
    } catch (e: any) {
      error = e?.name === 'TimeoutError'
        ? `${base} did not answer /v1/models within 5s`
        : `${e?.message ?? String(e)} (tried ${base})`;
    }

    if (error) {
      this.config = {
        ...this.config,
        isConnected: false,
        isChecking: false,
        lastChecked: new Date().toISOString(),
        availableModels: [],
        connectionError: error,
      };
      return { connected: false, models: [], error };
    }

    // Keep the selection valid: a previously chosen alias that no longer exists
    // would otherwise send requests to a model the server does not serve.
    const previous = this.config.selectedModel;
    const stillPresent = models.some((m) => m.name === previous || m.model === previous);
    const selectedModel = stillPresent ? previous : (models[0]?.model ?? models[0]?.name ?? '');

    this.config = {
      ...this.config,
      isConnected: true,
      isChecking: false,
      lastChecked: new Date().toISOString(),
      availableModels: models,
      ...(stillPresent ? {} : { selectedModel }),
    };

    return { connected: true, models };
  }

  /**
   * Direct text/reasoning generation via the local-first backend (Fable MiniCPM,
   * falling back to Gemini when the local server is unavailable).
   */
  public async generate(
    req: OllamaReasoningRequest,
    onToken?: (token: string) => void
  ): Promise<OllamaReasoningResponse> {
    const model = this.config.selectedModel || DEFAULT_OLLAMA_CONFIG.selectedModel;
    const startTime = performance.now();

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: req.prompt,
          stream: Boolean(req.stream && onToken),
          taskType: req.taskType
        })
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      if (req.stream && onToken && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let evalCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.text) {
                  fullText += parsed.text;
                  onToken(parsed.text);
                  evalCount++;
                }
              } catch (e) {
                // skip parse error
              }
            }
          }
        }

        const totalDuration = performance.now() - startTime;
        const tokensPerSec = (evalCount / (totalDuration / 1000));

        return {
          rawResponse: fullText,
          model,
          totalDurationMs: totalDuration,
          evalCount,
          evalDurationMs: totalDuration,
          tokensPerSecond: Math.round(tokensPerSec * 10) / 10,
          isFallback: false
        };
      } else {
        const data = await response.json();
        const totalDuration = performance.now() - startTime;
        return {
          rawResponse: data.text || '',
          model,
          totalDurationMs: totalDuration,
          evalCount: 0,
          evalDurationMs: totalDuration,
          tokensPerSecond: 0,
          isFallback: false
        };
      }
    } catch (err: any) {
      console.warn('Generate failed, using local deterministic reasoning fallback:', err);
      const totalDuration = performance.now() - startTime;
      return {
        rawResponse: `[Local Fallback Simulation]: Analyzed decision with deterministic multi-genome heuristics.\n\nProblem: ${req.prompt}`,
        model: `${model} (Simulated Fallback)`,
        totalDurationMs: totalDuration,
        evalCount: 150,
        evalDurationMs: totalDuration,
        tokensPerSecond: 45,
        isFallback: true,
        error: err.message
      };
    }
  }

  /**
   * Weighs decision options with percentage weights and pros/cons using the
   * local-first LLM (Fable MiniCPM, Gemini fallback).
   */
  public async weighDecisionWithOptions(
    topic: string,
    context: string,
    candidateOptions?: string[]
  ): Promise<DecisionMatrixResult> {
    try {
      const response = await fetch('/api/gemini/weigh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          context,
          candidateOptions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from Gemini weigh endpoint');
      }

      const parsed = await response.json();
      
      if (parsed.options && Array.isArray(parsed.options) && parsed.options.length > 0) {
        const validatedOptions: WeightedDecisionOption[] = parsed.options.map((opt: any, idx: number) => ({
          id: opt.id || `opt_${idx + 1}`,
          title: opt.title || `Option ${idx + 1}`,
          description: opt.description || '',
          weightPercentage: typeof opt.weightPercentage === 'number' ? opt.weightPercentage : 33,
          confidenceScore: typeof opt.confidenceScore === 'number' ? opt.confidenceScore : 85,
          pros: Array.isArray(opt.pros) && opt.pros.length > 0 ? opt.pros : ['Strong execution leverage', 'Proven tactical design'],
          cons: Array.isArray(opt.cons) && opt.cons.length > 0 ? opt.cons : ['Implementation complexity', 'Requires careful verification'],
          riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(opt.riskLevel) ? opt.riskLevel : 'MEDIUM',
          expectedROI: opt.expectedROI || 'High Risk-Adjusted ROI',
          timeToValue: opt.timeToValue || 'Standard implementation cycle',
          recommended: Boolean(opt.recommended ?? (idx === 0)),
          verdictTag: opt.verdictTag || (idx === 0 ? 'STRONGLY_RECOMMENDED' : 'VIABLE_ALTERNATIVE'),
          mitigationStrategy: opt.mitigationStrategy || 'Implement continuous monitoring and safety circuit breaker thresholds.',
          supportingLeaders: Array.isArray(opt.supportingLeaders) ? opt.supportingLeaders : ['System Synthesis'],
          scores: {
            feasibility: opt.scores?.feasibility || 80,
            upsidePotential: opt.scores?.upsidePotential || 85,
            safetyFloor: opt.scores?.safetyFloor || 80,
            executionSpeed: opt.scores?.executionSpeed || 75,
            capitalEfficiency: opt.scores?.capitalEfficiency || 80
          }
        }));

        const normalizedOptions = DecisionMatrixEngine.normalizeWeights(validatedOptions);
        const topOption = normalizedOptions.find(o => o.recommended) || normalizedOptions[0];

        return {
          id: `matrix_local_${Date.now()}`,
          decisionTopic: parsed.decisionTopic || topic,
          context,
          totalOptionsCount: normalizedOptions.length,
          options: normalizedOptions,
          recommendedOptionId: topOption ? topOption.id : 'opt_1',
          synthesisRationale: parsed.synthesisRationale || `Evaluated by the local model with ${normalizedOptions.length} ranked alternatives.`,
          tradeOffSummary: parsed.tradeOffSummary || `Balanced trade-off between ${normalizedOptions[0]?.title} and alternative paths.`,
          generatedBy: 'local_model',
          modelUsed: this.config.selectedModel || DEFAULT_OLLAMA_CONFIG.selectedModel,
          timestamp: new Date().toISOString(),
          normalizedPercentageSum: 100
        };
      }
    } catch (err) {
      console.warn('Failed to parse LLM JSON decision matrix, falling back to deterministic matrix engine:', err);
    }

    // Fallback to deterministic matrix
    const matrix = DecisionMatrixEngine.generateMatrix(topic + ' ' + context);
    matrix.generatedBy = 'hybrid';
    matrix.modelUsed = `${this.config.selectedModel || DEFAULT_OLLAMA_CONFIG.selectedModel} (Hybrid Fallback)`;
    return matrix;
  }
}

export const globalOllamaClient = new OllamaClient();
