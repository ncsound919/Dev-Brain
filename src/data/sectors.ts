import { SectorDefinition, SectorType } from '../types';

export const SECTORS: Record<SectorType, SectorDefinition> = {
  dev: {
    id: 'dev',
    name: 'Dev Brain (AI & Software Systems)',
    shortName: 'Dev Brain',
    icon: 'Code2',
    badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    accentColor: 'amber',
    description: 'AI architectures, deep learning engineering, training loops, distributed scaling & interpretability.',
    councils: ['Deep Learning', 'Framework Design', 'Agentic Systems', 'Systems Architecture', 'Interpretability & Efficiency'],
    leaderCount: 20
  },
  business: {
    id: 'business',
    name: 'Business Brain (Strategy & Org Execution)',
    shortName: 'Business Brain',
    icon: 'Briefcase',
    badgeColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    accentColor: 'blue',
    description: 'Disruption theory, competitive positioning, business model design, change leadership & culture.',
    councils: ['Competitive Strategy', 'Operating Models & Quality', 'Innovation & Growth', 'Leadership & Culture', 'People & Talent Analytics'],
    leaderCount: 20
  },
  financial: {
    id: 'financial',
    name: 'Financial Brain (Valuation & Capital Allocation)',
    shortName: 'Financial Brain',
    icon: 'TrendingUp',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    accentColor: 'emerald',
    description: 'Intrinsic valuation, margin of safety, macroeconomic cycles, FP&A operations & banking platforms.',
    councils: ['Value Investing & Moats', 'Macro Cycles & Believability', 'Corporate Valuation & DCF', 'CFO & FP&A Operations', 'Fintech & Banking Strategy'],
    leaderCount: 20
  },
  science_biotech: {
    id: 'science_biotech',
    name: 'Science Brain (Biotech & Oncology)',
    shortName: 'Biotech Brain',
    icon: 'Dna',
    badgeColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    accentColor: 'purple',
    description: 'Cellular immunotherapy, cancer genomics, precision oncology, CRISPR gene-editing & AI drug discovery.',
    councils: ['Cell Therapy & CAR-T', 'Cancer Genomics & Heterogeneity', 'Precision & Targeted Oncology', 'Biotech Platform & Drug Discovery'],
    leaderCount: 20
  },
  science_sports: {
    id: 'science_sports',
    name: 'Science Brain (Sports Science & Human Performance)',
    shortName: 'Sports Brain',
    icon: 'Activity',
    badgeColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accentColor: 'rose',
    description: 'Muscle physiology, movement mechanics under load, athletic periodization & performance psychology.',
    councils: ['Physiology & Recovery', 'Movement & Mechanics', 'Performance Psychology', 'Coaching Systems & Execution'],
    leaderCount: 20
  }
};
