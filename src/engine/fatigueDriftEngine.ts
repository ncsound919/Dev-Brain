import { FatigueDriftDataPoint } from '../types';

export class FatigueDriftEngine {
  public static async simulateBurnout(
    complexityScore: number, 
    resourceAllocation: number,
    timeHorizonMonths: number = 36
  ): Promise<FatigueDriftDataPoint[]> {
    try {
      const response = await fetch('/api/gemini/fatigue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complexityScore, resourceAllocation, timeHorizonMonths })
      });
      if (!response.ok) throw new Error('Failed to fetch fatigue drift simulation');
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Failed to simulate burnout via API, falling back to mock.', err);
    }

    const data: FatigueDriftDataPoint[] = [];
    
    let currentCognitiveLoad = 20;
    let currentCapitalBurn = 10;
    let currentIntegrity = 100;

    for (let month = 1; month <= timeHorizonMonths; month++) {
      // High complexity accelerates load
      const loadIncrease = (complexityScore / 100) * (month * 0.5);
      currentCognitiveLoad = Math.min(100, currentCognitiveLoad + loadIncrease);

      // Low resource allocation accelerates integrity decay
      const capitalDecay = ((100 - resourceAllocation) / 100) * (month * 0.8);
      currentCapitalBurn = Math.min(100, currentCapitalBurn + (resourceAllocation / 20) + capitalDecay);

      if (currentCognitiveLoad > 80) {
        currentIntegrity -= 5;
      }
      if (currentCapitalBurn > 90) {
        currentIntegrity -= 8;
      }
      currentIntegrity = Math.max(0, currentIntegrity);

      data.push({
        month,
        cognitiveLoad: Math.round(currentCognitiveLoad),
        capitalBurn: Math.round(currentCapitalBurn),
        structuralIntegrity: Math.round(currentIntegrity)
      });
    }

    return data;
  }
}
