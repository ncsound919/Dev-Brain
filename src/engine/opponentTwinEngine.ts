import { OpponentDigitalTwin, OpponentCounterMove } from '../types';

export class OpponentTwinEngine {
  public static async getTwinForSector(sector: string): Promise<OpponentDigitalTwin> {
    try {
      const response = await fetch('/api/gemini/opponent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector })
      });
      if (!response.ok) throw new Error('Failed to generate opponent twin');
      return await response.json();
    } catch (err) {
      console.warn('Failed to generate opponent twin via API, falling back to mock.', err);
      if (sector.includes('science')) {
        return {
          id: 'twin_defense',
          name: 'Cover-0 Blitz Defense',
          type: 'DEFENSIVE_SCHEME',
          aggressiveness: 0.95,
          adaptability: 0.7,
          historicalTendencies: [
            { trigger: 'Spread Offense', response: 'Zone Pressure', probability: 0.4 },
            { trigger: 'Heavy Run Formation', response: 'Run Blitz', probability: 0.8 },
            { trigger: 'Empty Backfield', response: 'Drop 8 Coverage', probability: 0.3 }
          ]
        };
      }
      return {
        id: 'twin_market',
        name: 'Incumbent Tech Giant',
        type: 'MARKET_COMPETITOR',
        aggressiveness: 0.8,
        adaptability: 0.5,
        historicalTendencies: [
          { trigger: 'Price Drop', response: 'Price Match + Bundle', probability: 0.9 },
          { trigger: 'New Feature Launch', response: 'Acquire Competitor', probability: 0.4 },
          { trigger: 'Niche Expansion', response: 'Ignore', probability: 0.7 }
        ]
      };
    }
  }

  public static async simulateScrimmage(
    ourMove: string,
    twin: OpponentDigitalTwin
  ): Promise<OpponentCounterMove[]> {
    try {
      const response = await fetch('/api/gemini/opponent/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: ourMove, twin })
      });
      if (!response.ok) throw new Error('Failed to simulate scrimmage');
      const moves = await response.json();
      if (moves && Array.isArray(moves)) {
        return moves.sort((a, b) => b.probability - a.probability);
      }
    } catch (err) {
      console.warn('Failed to simulate scrimmage via API, falling back to mock.', err);
    }

    const baseMoves: OpponentCounterMove[] = [];
    if (twin.type === 'DEFENSIVE_SCHEME') {
      baseMoves.push({
        moveName: 'All-Out Zero Blitz',
        probability: twin.aggressiveness * 0.8,
        impactOnOurSuccess: -0.6,
        description: 'Opponent brings 1 more rusher than blockers, forcing immediate hot throw.'
      });
      baseMoves.push({
        moveName: 'Simulated Pressure (Bail to Tampa 2)',
        probability: twin.adaptability * 0.6,
        impactOnOurSuccess: -0.3,
        description: 'Shows blitz but drops into deep zone, aiming for interception on hot route.'
      });
    } else {
      baseMoves.push({
        moveName: 'Aggressive Capital Dumping',
        probability: twin.aggressiveness * 0.7,
        impactOnOurSuccess: -0.5,
        description: 'Opponent out-spends by 3x on marketing to drown out our move.'
      });
      baseMoves.push({
        moveName: 'Fast-Follow Feature Copy',
        probability: twin.adaptability * 0.9,
        impactOnOurSuccess: -0.4,
        description: 'Clones the feature in 4 weeks but integrates into existing ecosystem.'
      });
    }
    return baseMoves.sort((a, b) => b.probability - a.probability);
  }
}
