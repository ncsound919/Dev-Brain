import React, { useState, useEffect } from 'react';
import { Dna, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { GenomeMutationEngine } from '../engine/genomeMutationEngine';
import { GenomeMutationVariant } from '../types';

export const GenomeMutationViewer: React.FC = () => {
  const [variants, setVariants] = useState<GenomeMutationVariant[]>([]);
  const [isEvolving, setIsEvolving] = useState(false);

  const runEvolution = async () => {
    setIsEvolving(true);
    setVariants([]);
    const result = await GenomeMutationEngine.runEvolution('Base Decision Strategy', 12);
    setVariants(result);
    setIsEvolving(false);
  };

  useEffect(() => {
    runEvolution();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Dna className="w-6 h-6 text-indigo-500" />
            Tactical Genome Mutation Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Uses genetic algorithms to evolve a decision into its mathematically optimal state.
          </p>
        </div>
        <button
          onClick={runEvolution}
          disabled={isEvolving}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isEvolving ? (
            <Zap className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Dna className="w-4 h-4" />
          )}
          Mutate 12 Generations
        </button>
      </div>

      <div className="bg-slate-950 rounded-lg border border-slate-800 p-1 overflow-x-auto">
        <div className="flex gap-2 p-4 min-w-max">
          {isEvolving ? (
            <div className="flex items-center justify-center w-full h-48 text-indigo-500 gap-3">
              <Zap className="w-8 h-8 animate-bounce" />
              <span className="font-mono text-sm tracking-widest uppercase">Evolving Gene Sequences...</span>
            </div>
          ) : (
            variants.map((v, i) => (
              <div key={v.id} className="flex items-center">
                <div className={`w-64 p-4 rounded-xl border flex flex-col justify-between h-56 transition-all ${
                  i === variants.length - 1 
                    ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-900 border-slate-700/50 opacity-70 scale-95'
                }`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-xs font-mono font-bold text-slate-500 uppercase">
                        Gen {v.generation}
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded font-bold ${
                        v.fitnessScore > 80 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        FITNESS: {v.fitnessScore}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">SPD:</span>
                        <span className={v.traits.speed > 70 ? 'text-emerald-400' : 'text-slate-300'}>{v.traits.speed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">RSK:</span>
                        <span className={v.traits.risk < 40 ? 'text-emerald-400' : 'text-rose-400'}>{v.traits.risk}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CAP:</span>
                        <span className={v.traits.capitalEfficiency > 70 ? 'text-emerald-400' : 'text-slate-300'}>{v.traits.capitalEfficiency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded leading-tight border border-slate-800">
                    {v.mutationLog}
                  </div>
                </div>
                {i < variants.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-slate-700 mx-2 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {variants.length > 0 && !isEvolving && (
        <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-200">
            <strong>Optimal Genome Achieved.</strong> Generation {variants[variants.length - 1].generation} yielded a fitness score of {variants[variants.length - 1].fitnessScore}, achieving maximum capital efficiency while suppressing risk parameters below structural failure thresholds.
          </div>
        </div>
      )}
    </div>
  );
};
