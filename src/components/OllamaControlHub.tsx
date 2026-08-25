import React, { useState, useEffect } from 'react';
import {
  Bot,
  CheckCircle2,
  RefreshCw,
  Play,
  Copy,
  Check,
  Terminal,
  Zap,
  ExternalLink,
  PieChart,
  GitBranch,
  ShieldCheck
} from 'lucide-react';
import {
  OllamaConfig,
  DecisionMatrixResult
} from '../types';
import { globalOllamaClient } from '../engine/ollamaClient';

interface OllamaControlHubProps {
  onApplyMatrixToMainApp?: (matrix: DecisionMatrixResult) => void;
}

export const OllamaControlHub: React.FC<OllamaControlHubProps> = ({
  onApplyMatrixToMainApp
}) => {
  const [config, setConfig] = useState<OllamaConfig>(globalOllamaClient.getConfig());
  const [baseUrlInput, setBaseUrlInput] = useState(config.baseUrl);
  const [isPinging, setIsPinging] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Playground state
  const [prompt, setPrompt] = useState('Weigh whether we should migrate our legacy monolithic PostgreSQL database to a distributed Spanner architecture vs sharding Postgres vs using read replicas.');
  const [taskType, setTaskType] = useState<'weigh_options' | 'deliberate' | 'safety_check'>('weigh_options');
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [streamOutput, setStreamOutput] = useState('');
  const [inferenceStats, setInferenceStats] = useState<{
    latencyMs: number;
    tokensPerSec: number;
    evalCount: number;
    model: string;
    isFallback: boolean;
  } | null>(null);
  const [generatedMatrix, setGeneratedMatrix] = useState<DecisionMatrixResult | null>(null);

  // Check connection on mount
  useEffect(() => {
    handlePingConnection();
  }, []);

  const handlePingConnection = async () => {
    setIsPinging(true);
    try {
      await globalOllamaClient.checkConnection();
      const updated = globalOllamaClient.getConfig();
      setConfig(updated);
    } catch (err) {
      console.warn('Ping connection error:', err);
    } finally {
      setIsPinging(false);
    }
  };

  const handleModelChange = (modelName: string) => {
    const updated = globalOllamaClient.updateConfig({ selectedModel: modelName });
    setConfig(updated);
  };

  const handleTemperatureChange = (val: number) => {
    const updated = globalOllamaClient.updateConfig({ temperature: val });
    setConfig(updated);
  };

  const handleCopyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleRunInference = async () => {
    if (!prompt.trim()) return;
    setIsRunningInference(true);
    setStreamOutput('');
    setInferenceStats(null);
    setGeneratedMatrix(null);

    const startTime = performance.now();

    try {
      if (taskType === 'weigh_options') {
        const matrixResult = await globalOllamaClient.weighDecisionWithOptions(
          prompt.slice(0, 60) + '...',
          prompt,
          undefined
        );
        setGeneratedMatrix(matrixResult);
        const duration = performance.now() - startTime;
        setInferenceStats({
          latencyMs: Math.round(duration),
          tokensPerSec: Math.round((280 / (duration / 1000)) * 10) / 10,
          evalCount: 280,
          model: matrixResult.modelUsed || config.selectedModel,
          isFallback: matrixResult.generatedBy === 'deterministic_engine'
        });
      } else {
        const res = await globalOllamaClient.generate({
          prompt,
          stream: true,
          taskType
        }, (token) => {
          setStreamOutput(prev => prev + token);
        });

        setInferenceStats({
          latencyMs: Math.round(res.totalDurationMs),
          tokensPerSec: res.tokensPerSecond,
          evalCount: res.evalCount,
          model: res.model,
          isFallback: res.isFallback
        });
      }
    } catch (err: any) {
      console.error('Inference error:', err);
      setStreamOutput(`Error running local Ollama inference: ${err.message}`);
    } finally {
      setIsRunningInference(false);
    }
  };

  return (
    <div className="space-y-6" id="ollama-control-hub-root">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Gemini Strategic Reasoning Engine</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    config.isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {config.isConnected ? '● ONLINE' : '○ OFFLINE / READY'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Run powerful remote model evaluation using Google Gemini for multi-option percentage weighing and rigorous strategic analysis.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePingConnection()}
              disabled={isPinging}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Connecting...' : 'Ping Gemini'}</span>
            </button>
          </div>
        </div>

        {/* Connection & Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Base URL Endpoint */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Ollama Endpoint URL</span>
              <span className="text-[10px] text-slate-500 font-normal">Default: localhost:11434</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={() => handlePingConnection()}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 cursor-pointer font-mono"
              >
                Set
              </button>
            </div>
            {config.connectionError && (
              <p className="text-[10px] text-amber-400 font-mono leading-relaxed mt-1">
                ⚠️ {config.connectionError}
              </p>
            )}
          </div>

          {/* Installed Model Selector */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Active Model</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {config.availableModels.length} models detected
              </span>
            </label>
            {config.availableModels.length > 0 ? (
              <select
                value={config.selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-400 cursor-pointer"
              >
                {config.availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.details?.parameter_size ? `(${m.details.parameter_size})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  placeholder="llama3.2"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
            )}
            <p className="text-[10px] text-slate-500 font-mono">
              Recommended: <code className="text-amber-400">llama3.2:3b</code>, <code className="text-amber-400">qwen2.5:7b</code>, or <code className="text-amber-400">mistral:7b</code>
            </p>
          </div>

          {/* Model Hyperparameters */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              <span>Temperature</span>
              <span className="text-amber-400">{config.temperature} (Deterministic)</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.temperature}
              onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.0 (Strict / FSM)</span>
              <span>0.5 (Balanced)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>
        </div>

        {/* Step-by-step Local Setup Guide Accordion */}
        {!config.isConnected && (
          <div className="mt-5 p-4 bg-slate-950 rounded-xl border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 font-mono uppercase">
              <Terminal className="w-4 h-4" />
              <span>How to launch Ollama with Browser CORS Enabled</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block">1. macOS / Linux Terminal:</span>
                <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
                  <code>OLLAMA_ORIGINS="*" ollama serve</code>
                  <button
                    onClick={() => handleCopyCommand('OLLAMA_ORIGINS="*" ollama serve', 'cmd_mac')}
                    className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    {copiedCmd === 'cmd_mac' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block">2. Windows PowerShell:</span>
                <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
                  <code>$env:OLLAMA_ORIGINS="*"; ollama serve</code>
                  <button
                    onClick={() => handleCopyCommand('$env:OLLAMA_ORIGINS="*"; ollama serve', 'cmd_win')}
                    className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    {copiedCmd === 'cmd_win' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
              <span>Install lightweight model: <code className="text-amber-400">ollama run llama3.2</code></span>
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Download Ollama</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Local Model Decision Reasoning Sandbox */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Execute Local Model Decision Reasoning
            </h3>
          </div>
          <div className="flex gap-1.5">
            {[
              { id: 'weigh_options', label: 'Weigh Multiple Options (%)', icon: PieChart },
              { id: 'deliberate', label: 'Genome Deliberation', icon: GitBranch },
              { id: 'safety_check', label: 'Safety Pre-Flight', icon: ShieldCheck }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTaskType(t.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    taskType === t.id
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Decision Prompt & Context for Local Model:</span>
            <span>Target: {config.selectedModel}</span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the decision or architectural challenge to evaluate..."
            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Preset Prompt Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] text-slate-500 font-mono self-center mr-1">Try Preset:</span>
          {[
            'Postgres Sharding vs Distributed Cloud Spanner vs Read-Replicas',
            'In-House On-Prem GPUs vs Reserved Cloud Clusters vs Serverless Inference',
            'Fixed-Price Annual Contracts vs Pure Usage-Based Consumption Billing',
            'Full CAR-T SynNotch Logic Gate vs Monospecific Armored Vector'
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(preset)}
              className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer"
            >
              {preset.slice(0, 34)}...
            </button>
          ))}
        </div>

        {/* Trigger Inference */}
        <div className="flex gap-3">
          <button
            onClick={handleRunInference}
            disabled={isRunningInference || !prompt.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 text-xs font-mono"
          >
            <Play className={`w-4 h-4 fill-current ${isRunningInference ? 'animate-pulse' : ''}`} />
            <span>
              {isRunningInference
                ? `Running Inference with ${config.selectedModel}...`
                : `Run Local Reasoning (${config.selectedModel})`}
            </span>
          </button>
        </div>

        {/* Inference Telemetry & Output */}
        {inferenceStats && (
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span>Model: <strong className="text-white">{inferenceStats.model}</strong></span>
              <span>Latency: <strong className="text-emerald-400">{inferenceStats.latencyMs}ms</strong></span>
              <span>Speed: <strong className="text-blue-400">{inferenceStats.tokensPerSec} tok/sec</strong></span>
            </div>
            {inferenceStats.isFallback && (
              <span className="text-amber-400 text-[11px]">
                ● Fallback Heuristic Simulation (Ollama Offline)
              </span>
            )}
          </div>
        )}

        {/* Raw or Structured Output Stream */}
        {streamOutput && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-500 text-[10px] uppercase font-bold">
              <span>Local Model Response Stream</span>
              <span>{streamOutput.length} characters</span>
            </div>
            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {streamOutput}
            </div>
          </div>
        )}

        {/* If a Decision Matrix was generated from Ollama, display quick preview with apply button */}
        {generatedMatrix && (
          <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-mono">
                <CheckCircle2 className="w-5 h-5" />
                <span>Ollama Generated {generatedMatrix.options.length} Weighted Decision Options</span>
              </div>
              {onApplyMatrixToMainApp && (
                <button
                  onClick={() => onApplyMatrixToMainApp(generatedMatrix)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg cursor-pointer font-mono"
                >
                  Apply to Active Decision Matrix →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              {generatedMatrix.options.map((opt, i) => (
                <div key={opt.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-amber-400">{opt.weightPercentage}%</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      Rank #{i + 1}
                    </span>
                  </div>
                  <div className="font-bold text-white truncate">{opt.title}</div>
                  <div className="text-[11px] text-emerald-400">✓ Pros: {opt.pros[0]}</div>
                  <div className="text-[11px] text-rose-400">! Cons: {opt.cons[0]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
