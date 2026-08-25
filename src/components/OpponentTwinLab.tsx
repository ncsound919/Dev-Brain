import React, { useState, useEffect } from 'react';
import { Shield, Target, Activity, AlertTriangle } from 'lucide-react';
import { OpponentTwinEngine } from '../engine/opponentTwinEngine';
import { OpponentDigitalTwin, OpponentCounterMove } from '../types';

interface Props {
  decisionContext: string;
  sector: string;
}

export const OpponentTwinLab: React.FC<Props> = ({ decisionContext, sector }) => {
  const [twin, setTwin] = useState<OpponentDigitalTwin | null>(null);
  const [counterMoves, setCounterMoves] = useState<OpponentCounterMove[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTwin = async () => {
      const generatedTwin = await OpponentTwinEngine.getTwinForSector(sector);
      if (mounted) {
        setTwin(generatedTwin);
        setCounterMoves([]);
      }
    };
    fetchTwin();
    return () => { mounted = false; };
  }, [sector]);

  const runScrimmage = async () => {
    if (!twin) return;
    setIsSimulating(true);
    const moves = await OpponentTwinEngine.simulateScrimmage(decisionContext, twin);
    setCounterMoves(moves);
    setIsSimulating(false);
  };

  if (!twin) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-rose-500" />
            Opponent Digital Twin Lab
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Pit your current strategy against a probabilistic digital twin of your opponent.
          </p>
        </div>
        <button
          onClick={runScrimmage}
          disabled={isSimulating}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSimulating ? (
            <Activity className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          Run Scrimmage
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TWIN PROFILE */}
        <div className="bg-slate-950 p-5 rounded-lg border border-slate-800">
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">
            Digital Twin Profile
          </div>
          <div className="text-2xl font-black text-rose-400 mb-2">{twin.name}</div>
          <div className="text-sm text-slate-400 mb-6 font-mono bg-slate-900 px-3 py-1 rounded inline-block">
            TYPE: {twin.type}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Aggressiveness</span>
                <span className="font-mono">{twin.aggressiveness * 100}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${twin.aggressiveness * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Adaptability</span>
                <span className="font-mono">{twin.adaptability * 100}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${twin.adaptability * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* COUNTER MOVES */}
        <div className="bg-slate-950 p-5 rounded-lg border border-slate-800">
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">
            Predicted Counter-Moves
          </div>
          
          {!counterMoves.length && !isSimulating && (
            <div className="h-40 flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
              Run scrimmage to project counter-moves
            </div>
          )}

          {isSimulating && (
            <div className="h-40 flex flex-col items-center justify-center text-rose-500 border border-dashed border-rose-900/50 rounded-lg">
              <Activity className="w-8 h-8 animate-spin mb-2" />
              <div className="text-sm font-mono">Simulating enemy responses...</div>
            </div>
          )}

          {counterMoves.length > 0 && !isSimulating && (
            <div className="space-y-3">
              {counterMoves.map((move, idx) => (
                <div key={idx} className="p-3 bg-slate-900 rounded border border-slate-800 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white text-sm">{move.moveName}</div>
                    <div className="text-xs font-mono px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {(move.probability * 100).toFixed(0)}% Likelihood
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {move.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
