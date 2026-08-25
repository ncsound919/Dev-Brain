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
      console.warn('Failed to run evolution via API, falling back to mock.', err);
    }

    const variants: GenomeMutationVariant[] = [];
    
    // Generation 0: Base
    let currentSpeed = 50;
    let currentRisk = 50;
    let currentCapital = 50;
    let currentInnovation = 50;
    
    for (let gen = 0; gen <= generations; gen++) {
      if (gen > 0) {
        // Mutate
        currentSpeed = Math.min(100, Math.max(0, currentSpeed + (Math.random() * 20 - 10)));
        currentRisk = Math.min(100, Math.max(0, currentRisk + (Math.random() * 20 - 10)));
        currentCapital = Math.min(100, Math.max(0, currentCapital + (Math.random() * 20 - 5))); // Bias toward better capital
        currentInnovation = Math.min(100, Math.max(0, currentInnovation + (Math.random() * 20 - 5))); // Bias toward higher innovation
      }

      // Fitness function: Maximize speed + capital + innovation, Minimize risk
      const fitnessScore = Math.round(((currentSpeed + currentCapital + currentInnovation + (100 - currentRisk)) / 400) * 100);
      
      let log = gen === 0 ? 'Base genome established.' : 'Micro-mutations applied.';
      if (gen > 0) {
        if (currentRisk < 40) log = 'Mutated to lower risk profile.';
        if (currentSpeed > 80) log = 'Mutated for aggressive time-to-market.';
        if (currentCapital > 80) log = 'Hyper-optimized capital efficiency.';
      }

      variants.push({
        id: `gen_${gen}_${Math.random().toString(36).substr(2, 5)}`,
        generation: gen,
        fitnessScore,
        traits: {
          speed: Math.round(currentSpeed),
          risk: Math.round(currentRisk),
          capitalEfficiency: Math.round(currentCapital),
          innovation: Math.round(currentInnovation)
        },
        mutationLog: log
      });
    }

    return variants;
  }
}
