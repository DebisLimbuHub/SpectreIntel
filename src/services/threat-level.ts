/**
 * Threat Level Calculation Service
 * Computes a composite 0-10 threat score from multiple input signals.
 *
 * Inspired by the concept art's semicircular gauge (8.7 / CRITICAL)
 * and WorldMonitor's DEFCON-style alerting system.
 */

import type { ThreatLevel, ThreatTrend } from '@/types';

export interface ThreatLevelInputs {
  activeZeroDays: number;
  criticalCVEsUnpatched: number;
  activeAPTCampaigns: number;
  ransomwareIncidents24h: number;
  infrastructureOutages: number;
  bgpAnomalies: number;
  velocitySpikes: number;
  signalConvergences: number;
}

const WEIGHTS = {
  activeZeroDays: 25,
  criticalCVEsUnpatched: 20,
  activeAPTCampaigns: 15,
  ransomwareIncidents24h: 15,
  infrastructureOutages: 10,
  bgpAnomalies: 5,
  velocitySpikes: 5,
  signalConvergences: 5,
} as const;

const NORMALISERS = {
  activeZeroDays: 3,
  criticalCVEsUnpatched: 10,
  activeAPTCampaigns: 5,
  ransomwareIncidents24h: 10,
  infrastructureOutages: 5,
  bgpAnomalies: 3,
  velocitySpikes: 5,
  signalConvergences: 3,
} as const;

export function calculateThreatLevel(
  inputs: ThreatLevelInputs,
  previousScore?: number,
): ThreatLevel {
  let weighted = 0;

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const k = key as keyof ThreatLevelInputs;
    const normalised = Math.min(inputs[k] / NORMALISERS[k], 1);
    weighted += normalised * weight;
  }

  const score = Math.round(weighted) / 10; // 0.0 - 10.0

  const label = getThreatLabel(score);
  const defconLevel = getDefconLevel(score);

  let trend: ThreatTrend = 'stable';
  if (previousScore !== undefined) {
    if (score > previousScore + 0.3) trend = 'rising';
    else if (score < previousScore - 0.3) trend = 'falling';
  }

  return {
    score,
    label,
    defconLevel,
    trend,
    components: inputs,
    updatedAt: new Date(),
  };
}

function getThreatLabel(score: number): string {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 5.0) return 'ELEVATED';
  if (score >= 3.0) return 'GUARDED';
  return 'LOW';
}

function getDefconLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 9.0) return 1;
  if (score >= 7.0) return 2;
  if (score >= 5.0) return 3;
  if (score >= 3.0) return 4;
  return 5;
}

// Labels matching WorldMonitor's DEFCON naming
export const DEFCON_LABELS: Record<number, { name: string; description: string }> = {
  1: { name: 'MAXIMUM ALERT', description: 'Nation-state attack on critical infrastructure' },
  2: { name: 'HIGH ALERT', description: 'Multiple zero-days with active exploitation' },
  3: { name: 'ELEVATED', description: 'Significant campaign activity detected' },
  4: { name: 'GUARDED', description: 'Above-normal threat levels' },
  5: { name: 'NORMAL', description: 'Baseline cyber operations' },
};
