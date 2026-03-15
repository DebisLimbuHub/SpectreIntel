import { useEffect, useState } from 'react';
import { useCyberStore } from '@/store';
import { filterByTime } from '@/utils/time-filter';
import { formatDistanceToNow } from 'date-fns';
import type { ThreatCluster } from '@/types';

/**
 * Ransomware Tracker — Active groups and recent victims.
 * Data sources:
 *   1. RSS feed clusters (keyword extraction — broadened patterns)
 *   2. ransomware.live API (/api/ransomware) — real victim data
 * Both sources are merged; the panel is never empty thanks to API fallback.
 */

interface RansomwareHit {
  group: string;
  title: string;
  source: string;
  publishedAt: Date;
  link: string;
}

interface GroupSummary {
  name: string;
  colour: string;
  hits: RansomwareHit[];
  count: number;
}

interface ApiGroup {
  name: string;
  count: number;
  victims: { id: string; name: string; group: string; publishedAt: string }[];
}

// Colour map for known groups
const GROUP_COLOURS: Record<string, string> = {
  'LockBit':        '#E00000',
  'BlackCat/ALPHV': '#E01515',
  'ALPHV':          '#E01515',
  'BlackCat':       '#E01515',
  'Cl0p':           '#D43A1A',
  'Play':           '#C46A2A',
  'Black Basta':    '#B31217',
  'Akira':          '#9B0A0A',
  'RansomHub':      '#8B0A0A',
  'Medusa':         '#7B0A0A',
  'Rhysida':        '#6B8080',
  'INC Ransom':     '#5B80A0',
  'Qilin':          '#4B7080',
  'BianLian':       '#5B6080',
};

function groupColour(name: string): string {
  return GROUP_COLOURS[name] ?? '#8A8F98';
}

// Broadened patterns — catches specific groups AND generic ransomware headlines
const RANSOMWARE_PATTERNS: { name: string; patterns: RegExp[]; colour: string }[] = [
  { name: 'LockBit',        patterns: [/lockbit/i, /lock\s*bit/i],         colour: '#E00000' },
  { name: 'BlackCat/ALPHV', patterns: [/blackcat/i, /alphv/i, /black\s*cat/i], colour: '#E01515' },
  { name: 'Cl0p',           patterns: [/cl0p/i, /clop/i],                  colour: '#D43A1A' },
  { name: 'Play',           patterns: [/play\s*ransom/i],                  colour: '#C46A2A' },
  { name: 'Black Basta',    patterns: [/black\s*basta/i],                  colour: '#B31217' },
  { name: 'Akira',          patterns: [/akira/i],                          colour: '#9B0A0A' },
  { name: 'RansomHub',      patterns: [/ransomhub/i, /ransom\s*hub/i],    colour: '#8B0A0A' },
  { name: 'Medusa',         patterns: [/medusa/i],                         colour: '#7B0A0A' },
  { name: 'Rhysida',        patterns: [/rhysida/i],                        colour: '#6B8080' },
  { name: 'INC Ransom',     patterns: [/inc\s*ransom/i],                   colour: '#5B80A0' },
  { name: 'Qilin',          patterns: [/qilin/i],                          colour: '#4B7080' },
  { name: 'BianLian',       patterns: [/bianlian/i, /bian\s*lian/i],       colour: '#5B6080' },
  {
    name: 'Ransomware (General)',
    patterns: [
      /ransomware/i,
      /ransom\s*attack/i,
      /ransom\s*demand/i,
      /ransom\s*payment/i,
      /data\s*held\s*ransom/i,
      /double\s*extortion/i,
      /data\s*leak\s*site/i,
      /ransom\s*note/i,
      /paid.*ransom/i,
      /ransom.*paid/i,
      /extortion\s*attack/i,
      /data\s*extortion/i,
      /leak\s*site/i,
    ],
    colour: '#8A8F98',
  },
];

const SPECIFIC_PATTERNS = RANSOMWARE_PATTERNS.filter((r) => r.name !== 'Ransomware (General)');

function extractRansomwareData(clusters: ThreatCluster[]): GroupSummary[] {
  const groupMap = new Map<string, RansomwareHit[]>();

  for (const cluster of clusters) {
    // Search title + description of primary article
    const primaryText = `${cluster.primary.title} ${cluster.primary.description || ''}`;
    // Also search all related articles for broader coverage
    const relatedText = cluster.related
      .map((r) => `${r.title} ${r.description || ''}`)
      .join(' ');
    const fullText = `${primaryText} ${relatedText}`;

    for (const { name, patterns } of RANSOMWARE_PATTERNS) {
      const matched = patterns.some((p) => p.test(fullText));
      if (!matched) continue;

      // Skip generic if a specific group already matched this cluster
      if (name === 'Ransomware (General)') {
        const specificMatch = SPECIFIC_PATTERNS.some((r) =>
          r.patterns.some((p) => p.test(fullText))
        );
        if (specificMatch) continue;
      }

      if (!groupMap.has(name)) groupMap.set(name, []);
      groupMap.get(name)!.push({
        group: name,
        title: cluster.primary.title,
        source: cluster.primary.source,
        publishedAt: new Date(cluster.primary.publishedAt),
        link: cluster.primary.link,
      });
      break; // one group per cluster
    }
  }

  const summaries: GroupSummary[] = [];
  for (const { name, colour } of RANSOMWARE_PATTERNS) {
    const hits = groupMap.get(name) ?? [];
    if (hits.length > 0) summaries.push({ name, colour, hits, count: hits.length });
  }

  summaries.sort((a, b) => b.count - a.count);
  return summaries;
}

function mergeGroups(feed: GroupSummary[], api: ApiGroup[]): GroupSummary[] {
  const merged = new Map<string, GroupSummary>();

  for (const g of feed) {
    merged.set(g.name, { ...g });
  }

  for (const g of api) {
    if (merged.has(g.name)) {
      // Boost count from API data if it's higher
      const existing = merged.get(g.name)!;
      existing.count = Math.max(existing.count, g.count);
    } else {
      // Add group from API not found in feeds
      merged.set(g.name, {
        name: g.name,
        colour: groupColour(g.name),
        hits: g.victims.map((v) => ({
          group: g.name,
          title: v.name,
          source: 'ransomware.live',
          publishedAt: v.publishedAt ? new Date(v.publishedAt) : new Date(),
          link: '',
        })),
        count: g.count,
      });
    }
  }

  return [...merged.values()].sort((a, b) => b.count - a.count);
}

export function RansomwareTrackerPanel() {
  const { clusters, timeFilter } = useCyberStore();
  const [feedGroups, setFeedGroups] = useState<GroupSummary[]>([]);
  const [apiGroups, setApiGroups]   = useState<ApiGroup[]>([]);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  // Derive from RSS clusters whenever clusters/timeFilter change
  useEffect(() => {
    if (clusters.length === 0) return;
    const filtered = filterByTime(clusters, timeFilter, (c) => c.primary.publishedAt);
    setFeedGroups(extractRansomwareData(filtered));
  }, [clusters, timeFilter]);

  // Fetch from ransomware.live API
  useEffect(() => {
    async function fetchAPI() {
      try {
        const res = await fetch('/api/ransomware');
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && Array.isArray(data.groups)) {
          setApiGroups(data.groups);
          setIsFallback(!!data.fallback);
        }
      } catch {
        // silently ignore — feed data still shows
      }
    }
    fetchAPI();
    const timer = setInterval(fetchAPI, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const groups = mergeGroups(feedGroups, apiGroups);
  const totalHits = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '250px', flexShrink: 0 }}>
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">🔒 RANSOMWARE TRACKER</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-gray-500">{totalHits} hits</span>
          {isFallback && (
            <span className="text-[7px] font-mono text-yellow-600 border border-yellow-800 px-1 rounded-sm">
              DEMO
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-gray-600 text-[10px] font-mono">
              {clusters.length === 0 ? 'Loading feeds...' : 'No ransomware activity detected'}
            </span>
          </div>
        ) : (
          <div className="p-1.5 space-y-1">
            <div className="text-[8px] font-mono text-gray-500 uppercase tracking-wider px-1 mb-1">
              Active Groups
            </div>

            {groups.map((group) => {
              const maxCount = Math.max(...groups.map((g) => g.count), 1);
              const barWidth = Math.max((group.count / maxCount) * 100, 8);
              const isExpanded = expanded === group.name;

              return (
                <div key={group.name}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : group.name)}
                    className="w-full flex items-center gap-2 px-1.5 py-1 rounded-sm hover:bg-cyber-hover/50 transition-all"
                  >
                    <span className="text-[10px] font-mono text-gray-300 w-24 text-left flex-shrink-0 truncate">
                      {group.name}
                    </span>
                    <div className="flex-1 h-2 bg-cyber-card rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          background: group.colour,
                          boxShadow: `0 0 4px ${group.colour}40`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-gray-300 w-6 text-right">
                      {group.count}
                    </span>
                    <span className="text-[8px] text-gray-600">
                      {isExpanded ? '▼' : '▸'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="pl-4 pr-1 pb-1 space-y-0.5">
                      {group.hits.slice(0, 5).map((hit, i) => (
                        hit.link ? (
                          <a
                            key={i}
                            href={hit.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-1 rounded-sm hover:bg-cyber-hover/30 transition-colors"
                          >
                            <p className="text-[9px] font-mono text-gray-400 leading-tight">
                              {hit.title.length > 70 ? hit.title.slice(0, 70) + '…' : hit.title}
                            </p>
                            <div className="text-[7px] font-mono text-gray-600 mt-0.5">
                              {hit.source} · {safeTimeAgo(hit.publishedAt)}
                            </div>
                          </a>
                        ) : (
                          <div key={i} className="block p-1">
                            <p className="text-[9px] font-mono text-gray-400 leading-tight">
                              {hit.title.length > 70 ? hit.title.slice(0, 70) + '…' : hit.title}
                            </p>
                            <div className="text-[7px] font-mono text-gray-600 mt-0.5">
                              {hit.source} · {safeTimeAgo(hit.publishedAt)}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function safeTimeAgo(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'recently';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'recently';
  }
}
