/**
 * Cyber Signal Correlation Engine
 * Adapted from WorldMonitor's signal intelligence system.
 *
 * Detects patterns and anomalies across multiple data streams:
 * - News feed clustering
 * - CVE disclosure velocity
 * - APT campaign activity
 * - Infrastructure outage correlation
 * - Market movements
 *
 * Signal Types:
 *   CONVERGENCE      — 3+ feeds report same threat within 30min
 *   TRIANGULATION    — Gov + vendor + researcher confirm same threat
 *   VELOCITY_SPIKE   — Threat mention rate doubling with 6+ sources/hr
 *   ZERO_DAY_SIGNAL  — Unusual vendor patching with low disclosure
 *   STEALTH_CAMPAIGN — Infrastructure changes without advisory
 *   APT_SURGE        — Multiple APT indicators in same sector/region
 *   PATCH_GAP        — Critical CVE + no vendor patch after 72h
 *   INFRA_CASCADE    — Outage + cable cut + BGP anomaly
 *   RANSOMWARE_WAVE  — 3+ same-family attacks in 24h
 *   EXPLOIT_CHAIN    — Multiple related CVEs being chained
 */

import type {
  CyberSignal,
  CyberSignalType,
  ThreatCluster,
  ThreatSeverity,
  CVEEntry,
  InternetOutage,
  BGPAnomaly,
  RansomwareVictim,
} from '@/types';
import { SOURCE_TYPES } from '@/config/feeds';

// ===== SIGNAL CONFIGURATION =====

interface SignalConfig {
  type: CyberSignalType;
  name: string;
  icon: string;
  description: string;
  minConfidence: number;
  ttlMinutes: number;
}

export const SIGNAL_CONFIGS: Record<CyberSignalType, SignalConfig> = {
  convergence: {
    type: 'convergence',
    name: 'Convergence',
    icon: '◉',
    description: 'Multiple independent feeds confirming the same threat',
    minConfidence: 60,
    ttlMinutes: 120,
  },
  triangulation: {
    type: 'triangulation',
    name: 'Triangulation',
    icon: '△',
    description: 'Government + vendor + researcher sources aligned',
    minConfidence: 75,
    ttlMinutes: 180,
  },
  velocity_spike: {
    type: 'velocity_spike',
    name: 'Velocity Spike',
    icon: '🔥',
    description: 'Threat mention rate accelerating rapidly',
    minConfidence: 65,
    ttlMinutes: 60,
  },
  zero_day_signal: {
    type: 'zero_day_signal',
    name: 'Zero-Day Signal',
    icon: '🔮',
    description: 'Unusual vendor activity suggesting undisclosed vulnerability',
    minConfidence: 55,
    ttlMinutes: 240,
  },
  stealth_campaign: {
    type: 'stealth_campaign',
    name: 'Stealth Campaign',
    icon: '👻',
    description: 'Infrastructure changes detected without advisory',
    minConfidence: 50,
    ttlMinutes: 360,
  },
  apt_surge: {
    type: 'apt_surge',
    name: 'APT Surge',
    icon: '⚠',
    description: 'Multiple APT indicators in same sector/region',
    minConfidence: 70,
    ttlMinutes: 240,
  },
  patch_gap: {
    type: 'patch_gap',
    name: 'Patch Gap',
    icon: '🕳️',
    description: 'Critical CVE without vendor patch after 72h',
    minConfidence: 80,
    ttlMinutes: 480,
  },
  infra_cascade: {
    type: 'infra_cascade',
    name: 'Infrastructure Cascade',
    icon: '🌊',
    description: 'Correlated outage + BGP anomaly + cable disruption',
    minConfidence: 60,
    ttlMinutes: 120,
  },
  ransomware_wave: {
    type: 'ransomware_wave',
    name: 'Ransomware Wave',
    icon: '🔒',
    description: '3+ same-family ransomware attacks in 24h',
    minConfidence: 75,
    ttlMinutes: 360,
  },
  exploit_chain: {
    type: 'exploit_chain',
    name: 'Exploit Chain',
    icon: '🔗',
    description: 'Multiple related CVEs being actively chained',
    minConfidence: 70,
    ttlMinutes: 240,
  },
};

// ===== SIGNAL DETECTION FUNCTIONS =====

let signalCounter = 0;

function makeSignal(
  type: CyberSignalType,
  confidence: number,
  severity: ThreatSeverity,
  title: string,
  description: string,
  sources: string[],
  extra?: { relatedCVEs?: string[]; relatedAPTs?: string[] }
): CyberSignal | null {
  const config = SIGNAL_CONFIGS[type];
  if (confidence < config.minConfidence) return null;

  signalCounter++;
  return {
    id: `signal-${type}-${signalCounter}-${Date.now()}`,
    type,
    confidence: Math.min(confidence, 95),
    severity,
    title,
    description,
    sources,
    relatedCVEs: extra?.relatedCVEs,
    relatedAPTs: extra?.relatedAPTs,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + config.ttlMinutes * 60_000),
  };
}

// ===== CONVERGENCE DETECTION =====

export function detectConvergence(clusters: ThreatCluster[]): CyberSignal[] {
  const signals: CyberSignal[] = [];

  for (const cluster of clusters) {
    if (cluster.sourceCount >= 3) {
      // Check if sources appeared within 30 minutes of each other
      const times = [cluster.primary, ...cluster.related]
        .map((item) => new Date(item.publishedAt).getTime());
      const span = Math.max(...times) - Math.min(...times);
      const withinWindow = span <= 30 * 60_000;

      if (withinWindow) {
        const confidence = Math.min(60 + (cluster.sourceCount - 3) * 10, 95);
        const signal = makeSignal(
          'convergence',
          confidence,
          cluster.severity,
          `Convergence: ${cluster.primary.title}`,
          `${cluster.sourceCount} sources confirmed within ${Math.round(span / 60_000)} minutes`,
          [cluster.primary.source, ...cluster.related.map((r) => r.source)],
        );
        if (signal) signals.push(signal);
      }
    }
  }

  return signals;
}

// ===== TRIANGULATION DETECTION =====

export function detectTriangulation(clusters: ThreatCluster[]): CyberSignal[] {
  const signals: CyberSignal[] = [];

  for (const cluster of clusters) {
    const allSources = [cluster.primary.id, ...cluster.related.map((r) => r.id)];
    const allFeedIds = [cluster.primary.source, ...cluster.related.map((r) => r.source)];

    // Check if we have Gov + Vendor + Press
    const hasGov = allFeedIds.some((id) => SOURCE_TYPES.gov.includes(id));
    const hasVendor = allFeedIds.some((id) => SOURCE_TYPES.vendor.includes(id));
    const hasPress = allFeedIds.some((id) => SOURCE_TYPES.press.includes(id));

    if (hasGov && hasVendor && hasPress) {
      const signal = makeSignal(
        'triangulation',
        85,
        cluster.severity,
        `Triangulated: ${cluster.primary.title}`,
        'Government, vendor, and press sources all confirm this threat',
        allFeedIds,
      );
      if (signal) signals.push(signal);
    }
  }

  return signals;
}

// ===== VELOCITY SPIKE DETECTION =====

export function detectVelocitySpike(clusters: ThreatCluster[]): CyberSignal[] {
  const signals: CyberSignal[] = [];

  for (const cluster of clusters) {
    if (cluster.velocity.level === 'spike' && cluster.velocity.trend === 'rising') {
      const confidence = Math.min(65 + cluster.velocity.sourcesPerHour * 3, 95);
      const signal = makeSignal(
        'velocity_spike',
        confidence,
        cluster.severity,
        `Velocity Spike: ${cluster.primary.title}`,
        `${cluster.velocity.sourcesPerHour} sources/hr and rising`,
        [cluster.primary.source, ...cluster.related.map((r) => r.source)],
      );
      if (signal) signals.push(signal);
    }
  }

  return signals;
}

// ===== PATCH GAP DETECTION =====

export function detectPatchGap(cves: CVEEntry[]): CyberSignal[] {
  const signals: CyberSignal[] = [];
  const now = Date.now();
  const seventyTwoHours = 72 * 60 * 60 * 1000;

  for (const cve of cves) {
    if (
      cve.cvssScore >= 9.0 &&
      !cve.patchAvailable &&
      cve.isExploitedInWild &&
      now - new Date(cve.publishedDate).getTime() > seventyTwoHours
    ) {
      const signal = makeSignal(
        'patch_gap',
        90,
        'critical',
        `Patch Gap: ${cve.id} (CVSS ${cve.cvssScore})`,
        `Critical CVE actively exploited for ${Math.round((now - new Date(cve.publishedDate).getTime()) / 3_600_000)}h without vendor patch`,
        ['NVD', 'CISA KEV'],
        { relatedCVEs: [cve.id] },
      );
      if (signal) signals.push(signal);
    }
  }

  return signals;
}

// ===== RANSOMWARE WAVE DETECTION =====

export function detectRansomwareWave(victims: RansomwareVictim[]): CyberSignal[] {
  const signals: CyberSignal[] = [];
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Group by ransomware family
  const byGroup: Record<string, RansomwareVictim[]> = {};
  for (const victim of victims) {
    if (now - new Date(victim.publishedAt).getTime() <= twentyFourHours) {
      if (!byGroup[victim.group]) byGroup[victim.group] = [];
      byGroup[victim.group].push(victim);
    }
  }

  for (const [group, groupVictims] of Object.entries(byGroup)) {
    if (groupVictims.length >= 3) {
      const signal = makeSignal(
        'ransomware_wave',
        75 + Math.min(groupVictims.length * 3, 20),
        'critical',
        `Ransomware Wave: ${group} — ${groupVictims.length} victims in 24h`,
        `Active campaign by ${group} targeting ${[...new Set(groupVictims.map((v) => v.sector))].join(', ')}`,
        ['Ransomwatch', 'DarkFeed'],
      );
      if (signal) signals.push(signal);
    }
  }

  return signals;
}

// ===== INFRASTRUCTURE CASCADE DETECTION =====

export function detectInfraCascade(
  outages: InternetOutage[],
  bgpAnomalies: BGPAnomaly[],
): CyberSignal[] {
  const signals: CyberSignal[] = [];
  const oneHour = 60 * 60 * 1000;

  for (const outage of outages) {
    if (outage.severity !== 'critical' && outage.severity !== 'high') continue;

    // Check for correlated BGP anomaly within 1 hour
    const correlatedBGP = bgpAnomalies.filter((bgp) =>
      Math.abs(new Date(bgp.detectedAt).getTime() - new Date(outage.startTime).getTime()) <= oneHour
    );

    if (correlatedBGP.length > 0) {
      const signal = makeSignal(
        'infra_cascade',
        70 + correlatedBGP.length * 5,
        'critical',
        `Infrastructure Cascade: ${outage.country}`,
        `Internet outage + ${correlatedBGP.length} BGP anomalies detected within 1h`,
        ['Cloudflare Radar', 'BGPStream'],
      );
      if (signal) signals.push(signal);
    }
  }

  return signals;
}

// ===== MASTER DETECTION FUNCTION =====

export interface CorrelationInputs {
  clusters: ThreatCluster[];
  cves: CVEEntry[];
  ransomwareVictims: RansomwareVictim[];
  outages: InternetOutage[];
  bgpAnomalies: BGPAnomaly[];
}

export function runCorrelationEngine(inputs: CorrelationInputs): CyberSignal[] {
  const allSignals: CyberSignal[] = [];

  allSignals.push(...detectConvergence(inputs.clusters));
  allSignals.push(...detectTriangulation(inputs.clusters));
  allSignals.push(...detectVelocitySpike(inputs.clusters));
  allSignals.push(...detectPatchGap(inputs.cves));
  allSignals.push(...detectRansomwareWave(inputs.ransomwareVictims));
  allSignals.push(...detectInfraCascade(inputs.outages, inputs.bgpAnomalies));

  // Deduplicate by type + similar title
  const seen = new Set<string>();
  return allSignals.filter((signal) => {
    const key = `${signal.type}:${signal.title.slice(0, 50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
