import { LeaderGenome, SectorType } from '../types';
import { DEV_GENOMES } from './devGenomes';
import { BUSINESS_GENOMES } from './businessGenomes';
import { FINANCIAL_GENOMES } from './financialGenomes';
import { BIOTECH_GENOMES } from './biotechGenomes';
import { SPORTS_GENOMES } from './sportsGenomes';

export const ALL_LEADER_GENOMES: Record<string, LeaderGenome> = {
  ...DEV_GENOMES,
  ...BUSINESS_GENOMES,
  ...FINANCIAL_GENOMES,
  ...BIOTECH_GENOMES,
  ...SPORTS_GENOMES
};

// Backward-compatible alias for existing code
export const DEVELOPER_GENOMES = ALL_LEADER_GENOMES;

export const GENOMES_BY_SECTOR: Record<SectorType, Record<string, LeaderGenome>> = {
  dev: DEV_GENOMES,
  business: BUSINESS_GENOMES,
  financial: FINANCIAL_GENOMES,
  science_biotech: BIOTECH_GENOMES,
  science_sports: SPORTS_GENOMES
};

export const getGenomesBySector = (sector: SectorType): Record<string, LeaderGenome> => {
  return GENOMES_BY_SECTOR[sector] || DEV_GENOMES;
};

export const getLeaderById = (id: string): LeaderGenome | undefined => {
  return ALL_LEADER_GENOMES[id];
};

export const getSubBrainCouncils = (sector: SectorType): string[] => {
  const genomes = Object.values(getGenomesBySector(sector));
  const subBrains = new Set<string>();
  genomes.forEach(g => {
    if (g.subBrain) subBrains.add(g.subBrain);
  });
  return Array.from(subBrains);
};
