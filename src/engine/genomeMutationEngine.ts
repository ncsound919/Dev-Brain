import { GenomeMutationVariant } from '../types';

export class GenomeMutationEngine {
  public static async runEvolution(baseStrategyName: string, generations: number = 10): Promise<GenomeMutationVariant[]> {
    try {
      const response = await fetch('/api/gemini/genome/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseStrategyName, generations })
      });
      if (!response.ok) throw new Error('Failed to run evolution via API');
      const variants = await response.json();
      if (variants && Array.isArray(variants) && variants.length > 0) {
        return variants;
      }
    } catch (err) {
      console.warn(
        `[genome] evolution API unavailable (${err instanceof Error ? err.message : String(err)}); returning no variants — this engine does not fabricate an evolution.`,
      );
    }

    // No fabricated fallback. The previous one was a per-generation Math.random
    // walk with no selection pressure and no parent→child lineage, surfaced as
    // "evolution" (measured 2026-10-15: two identical runs produced different
    // fitness arrays, 50,53,59,58,61,61 vs 50,49,50,56,57,58). Invented
    // variants are worse than none: the UI can say "the model is unreachable",
    // but a caller cannot tell a computed variant from a random one. An empty
    // result is the honest answer.
    return [];
  }
}
