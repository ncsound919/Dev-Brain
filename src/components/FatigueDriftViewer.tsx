import React, { useState, useEffect } from 'react';
import { BatteryWarning } from 'lucide-react';
import { FatigueDriftEngine } from '../engine/fatigueDriftEngine';
import { FatigueDriftDataPoint } from '../types';

export const FatigueDriftViewer: React.FC = () => {
  const [data, setData] = useState<FatigueDriftDataPoint[]>([]);
  const [complexity, setComplexity] = useState(60);
  const [resources, setResources] = useState(50);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      const result = await FatigueDriftEngine.simulateBurnout(complexity, resources, 24);
      if (mounted) {
        setData(result);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [complexity, resources]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BatteryWarning className="w-6 h-6 text-amber-500" />
            Biomechanical & Capital Fatigue Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Project team burnout and capital exhaustion over a 24-month horizon.
          </p>
        </div>
        
        <div className="flex items-center gap-6 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Complexity / Load</label>
            <input 
              type="range" min="10" max="100" value={complexity} 
              onChange={e => setComplexity(Number(e.target.value))}
              className="w-32 accent-rose-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Resource Allocation</label>
            <input 
              type="range" min="10" max="100" value={resources} 
              onChange={e => setResources(Number(e.target.value))}
              className="w-32 accent-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="relative h-64 bg-slate-950 rounded-lg border border-slate-800 p-4 pt-8 overflow-hidden flex items-end">
        {/* Graph background lines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 pb-8 opacity-20">
          {[100, 75, 50, 25, 0].map(val => (
            <div key={val} className="border-b border-slate-600 w-full h-0 relative">
              <span className="absolute -top-3 -left-2 text-[10px] font-mono text-slate-400">{val}</span>
            </div>
          ))}
        </div>

        {/* Data lines rendered via flex columns for simplicity without a charting library */}
        <div className="relative w-full h-full flex items-end justify-between gap-1 z-10 px-4">
          {data.map((point) => (
            <div key={point.month} className="relative h-full w-full flex flex-col justify-end group">
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-800 text-xs p-2 rounded shadow-xl border border-slate-700 z-20 w-32">
                <div className="font-bold mb-1 border-b border-slate-700 pb-1">Month {point.month}</div>
                <div className="text-rose-400 flex justify-between"><span>Load:</span> <span>{point.cognitiveLoad}</span></div>
                <div className="text-emerald-400 flex justify-between"><span>Burn:</span> <span>{point.capitalBurn}</span></div>
                <div className="text-blue-400 flex justify-between"><span>Health:</span> <span>{point.structuralIntegrity}</span></div>
              </div>

              <div className="w-full flex justify-center items-end gap-[1px]">
                {/* Structural Integrity Bar */}
                <div className="w-1/3 bg-blue-500/50 rounded-t-sm" style={{ height: `${point.structuralIntegrity}%` }} />
                {/* Cognitive Load Bar */}
                <div className="w-1/3 bg-rose-500/80 rounded-t-sm" style={{ height: `${point.cognitiveLoad}%` }} />
                {/* Capital Burn Bar */}
                <div className="w-1/3 bg-emerald-500/80 rounded-t-sm" style={{ height: `${point.capitalBurn}%` }} />
              </div>
              
              {/* X Axis Label */}
              {point.month % 3 === 0 && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono">
                  M{point.month}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-8 mt-10 text-xs font-mono">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500/50 rounded-sm" /> Structural Health</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500/80 rounded-sm" /> Cognitive/Team Load</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/80 rounded-sm" /> Capital Burn</div>
      </div>
    </div>
  );
};
