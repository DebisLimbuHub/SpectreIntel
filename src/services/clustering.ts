/**
 * News Clustering Service
 * Adapted from WorldMonitor's Jaccard similarity clustering.
 *
 * Groups related cyber threat articles by headline similarity,
 * then ranks clusters by source tier and severity.
 *
 * This runs in a Web Worker for performance (O(n²) comparison).
 */

import type { ThreatFeedItem, ThreatCluster, ThreatSeverity, VelocityData } from '@/types';

// ===== STOP WORDS =====
// Common words filtered before similarity comparison
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'but', 'and', 'or',
  // Cyber-specific stop words (too common to be meaningful)
  'security', 'cyber', 'attack', 'new', 'report', 'says', 'update',
  'latest', 'breaking', 'alert', 'warning', 'researchers', 'found',
  'disclosed', 'discovered', 'threat', 'actors',
]);

// ===== SEVERITY KEYWORDS =====
const SEVERITY_KEYWORDS: Record<ThreatSeverity, string[]> = {
  critical: [
    'zero-day', 'zeroday', '0day', 'rce', 'remote-code-execution',
    'ransomware', 'breach', 'supply-chain', 'critical', 'emergency',
    'wiper', 'destructive', 'nation-state', 'actively-exploited',
    'infrastructure-attack', 'scada', 'ics-attack',
  ],
  high: [
    'vulnerability', 'exploit', 'ddos', 'malware', 'backdoor',
    'phishing', 'cve', 'apt', 'trojan', 'botnet', 'compromise',
    'exfiltration', 'privilege-escalation', 'authentication-bypass',
  ],
  medium: [
    'patch', 'advisory', 'update', 'disclosure', 'campaign',
    'credential', 'misconfiguration', 'exposure', 'leak',
  ],
  low: [
    'research', 'poc', 'proof-of-concept', 'awareness', 'guide',
    'report', 'analysis', 'trend', 'prediction', 'survey',
  ],
  info: [
    'tool', 'framework', 'release', 'conference', 'training',
    'certification', 'best-practice', 'standard',
  ],
};

// ===== TOKENISATION =====

function tokenise(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

// ===== JACCARD SIMILARITY =====

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ===== SEVERITY SCORING =====

export function scoreSeverity(title: string, description: string): ThreatSeverity {
  const text = `${title} ${description}`.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');

  const severities: ThreatSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  for (const severity of severities) {
    for (const keyword of SEVERITY_KEYWORDS[severity]) {
      if (text.includes(keyword.replace(/-/g, ' ')) || text.includes(keyword.replace(/-/g, ''))) {
        return severity;
      }
    }
  }
  return 'medium'; // Default
}

// ===== VELOCITY CALCULATION =====

function calculateVelocity(items: ThreatFeedItem[]): VelocityData {
  if (items.length < 2) {
    return { sourcesPerHour: 0, trend: 'stable', level: 'normal' };
  }

  const sorted = [...items].sort((a, b) =>
    new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const first = new Date(sorted[0].publishedAt).getTime();
  const last = new Date(sorted[sorted.length - 1].publishedAt).getTime();
  const spanHours = Math.max((last - first) / 3_600_000, 0.1);
  const sourcesPerHour = items.length / spanHours;

  // Trend: compare first half vs second half publication rate
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  const firstRate = firstHalf.length / Math.max(spanHours / 2, 0.1);
  const secondRate = secondHalf.length / Math.max(spanHours / 2, 0.1);

  const trend: VelocityData['trend'] =
    secondRate > firstRate * 1.3 ? 'rising' :
    secondRate < firstRate * 0.7 ? 'falling' :
    'stable';

  const level: VelocityData['level'] =
    sourcesPerHour > 6 ? 'spike' :
    sourcesPerHour > 3 ? 'elevated' :
    'normal';

  return { sourcesPerHour: Math.round(sourcesPerHour * 10) / 10, trend, level };
}

// ===== MAIN CLUSTERING FUNCTION =====

const SIMILARITY_THRESHOLD = 0.35; // Lower than WM's 0.5 for cyber-specific short headlines

export function clusterFeedItems(items: ThreatFeedItem[]): ThreatCluster[] {
  if (items.length === 0) return [];

  // Tokenise all headlines
  const tokenised = items.map((item) => ({
    item,
    tokens: tokenise(item.title),
  }));

  // Track which items are already clustered
  const clustered = new Set<string>();
  const clusters: ThreatCluster[] = [];

  for (let i = 0; i < tokenised.length; i++) {
    if (clustered.has(tokenised[i].item.id)) continue;

    const cluster: ThreatFeedItem[] = [tokenised[i].item];
    clustered.add(tokenised[i].item.id);

    for (let j = i + 1; j < tokenised.length; j++) {
      if (clustered.has(tokenised[j].item.id)) continue;

      const sim = jaccardSimilarity(tokenised[i].tokens, tokenised[j].tokens);
      if (sim >= SIMILARITY_THRESHOLD) {
        cluster.push(tokenised[j].item);
        clustered.add(tokenised[j].item.id);
      }
    }

    // Sort cluster by source tier (lowest = most authoritative), then recency
    cluster.sort((a, b) => {
      if (a.sourceTier !== b.sourceTier) return a.sourceTier - b.sourceTier;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    const primary = cluster[0];
    const related = cluster.slice(1);

    // Determine cluster severity (highest severity wins)
    const severityRank: Record<ThreatSeverity, number> = {
      critical: 0, high: 1, medium: 2, low: 3, info: 4,
    };
    const clusterSeverity = cluster.reduce<ThreatSeverity>((best, item) => {
      return severityRank[item.severity] < severityRank[best] ? item.severity : best;
    }, 'info');

    clusters.push({
      id: `cluster-${primary.id}`,
      primary,
      related,
      sourceCount: cluster.length,
      velocity: calculateVelocity(cluster),
      severity: clusterSeverity,
      isNew: false,
    });
  }

  // Sort clusters: by severity, then by source count, then by recency
  clusters.sort((a, b) => {
    const sevOrder: Record<ThreatSeverity, number> = {
      critical: 0, high: 1, medium: 2, low: 3, info: 4,
    };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) {
      return sevOrder[a.severity] - sevOrder[b.severity];
    }
    if (a.sourceCount !== b.sourceCount) return b.sourceCount - a.sourceCount;
    return new Date(b.primary.publishedAt).getTime() - new Date(a.primary.publishedAt).getTime();
  });

  return clusters;
}
