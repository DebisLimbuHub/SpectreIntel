/**
 * RSS Feed Service — Fetches cyber threat news through the API proxy.
 * Each feed has its own circuit breaker for fault isolation.
 */

import { FEEDS, type FeedConfig } from '@/config/feeds';
import { CircuitBreaker } from '@/utils/circuit-breaker';
import type { ThreatFeedItem, ThreatSeverity } from '@/types';

const API_BASE = '/api/rss';

// Per-feed circuit breakers
const breakers = new Map<string, CircuitBreaker<ThreatFeedItem[]>>();

function getBreaker(feedId: string): CircuitBreaker<ThreatFeedItem[]> {
  if (!breakers.has(feedId)) {
    breakers.set(feedId, new CircuitBreaker(`rss:${feedId}`, {
      failureThreshold: 2,
      cooldownMs: 300_000,  // 5 min
      cacheTtlMs: 600_000,  // 10 min
    }));
  }
  return breakers.get(feedId)!;
}

// ===== SEVERITY DETECTION =====

const SEVERITY_PATTERNS: { severity: ThreatSeverity; patterns: RegExp[] }[] = [
  {
    severity: 'critical',
    patterns: [
      /zero[- ]?day/i, /0[- ]?day/i, /rce\b/i, /remote code execution/i,
      /ransomware/i, /breach/i, /supply[- ]?chain/i, /actively exploited/i,
      /wiper/i, /destructive/i, /nation[- ]?state/i, /critical vulnerability/i,
      /scada|ics[- ]?attack/i, /infrastructure attack/i,
    ],
  },
  {
    severity: 'high',
    patterns: [
      /vulnerability/i, /exploit/i, /ddos/i, /malware/i, /backdoor/i,
      /phishing/i, /\bcve\b/i, /\bapt\b/i, /trojan/i, /botnet/i,
      /privilege escalation/i, /authentication bypass/i, /data leak/i,
    ],
  },
  {
    severity: 'medium',
    patterns: [
      /patch/i, /advisory/i, /update/i, /disclosure/i, /campaign/i,
      /credential/i, /misconfiguration/i, /exposure/i,
    ],
  },
];

function detectSeverity(title: string, description: string): ThreatSeverity {
  const text = `${title} ${description}`;
  for (const { severity, patterns } of SEVERITY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) return severity;
    }
  }
  return 'low';
}

// ===== CVE EXTRACTION =====

const CVE_REGEX = /CVE-\d{4}-\d{4,}/gi;

function extractCVEs(text: string): string[] {
  const matches = text.match(CVE_REGEX);
  return matches ? [...new Set(matches.map((m) => m.toUpperCase()))] : [];
}

// ===== FETCH SINGLE FEED =====

async function fetchFeed(feed: FeedConfig): Promise<ThreatFeedItem[]> {
  const breaker = getBreaker(feed.id);

  return breaker.call(async () => {
    const url = `${API_BASE}?url=${encodeURIComponent(feed.url)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status} for ${feed.name}`);
    }

    const data = await response.json();
    if (!data.ok || !Array.isArray(data.items)) {
      throw new Error(`Invalid response from proxy for ${feed.name}`);
    }

    return data.items.map((item: { title: string; link: string; description: string; pubDate: string }, i: number) => {
      const title = item.title || 'Untitled';
      const description = item.description || '';

      return {
        id: `${feed.id}-${i}-${Date.now()}`,
        title,
        description,
        link: item.link || '',
        source: feed.name,
        sourceTier: feed.tier,
        sourceType: feed.category,
        category: feed.category,
        severity: detectSeverity(title, description),
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        fetchedAt: new Date(),
        cves: extractCVEs(`${title} ${description}`),
      } satisfies ThreatFeedItem;
    });
  });
}

// ===== FETCH ALL ENABLED FEEDS =====

export async function fetchAllFeeds(): Promise<ThreatFeedItem[]> {
  const enabledFeeds = FEEDS.filter((f) => f.enabled);
  const results = await Promise.allSettled(
    enabledFeeds.map((feed) => fetchFeed(feed))
  );

  const allItems: ThreatFeedItem[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`[RSS] Fetched ${successCount}/${enabledFeeds.length} feeds (${failCount} failed), ${allItems.length} total items`);

  // Sort by publish date, newest first
  allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return allItems;
}

// ===== SERVICE STATUS =====

export function getFeedServiceStatus(): { total: number; healthy: number; open: number } {
  const enabledFeeds = FEEDS.filter((f) => f.enabled);
  let healthy = 0;
  let open = 0;

  for (const feed of enabledFeeds) {
    const breaker = breakers.get(feed.id);
    if (!breaker || breaker.getState() === 'closed') {
      healthy++;
    } else {
      open++;
    }
  }

  return { total: enabledFeeds.length, healthy, open };
}
