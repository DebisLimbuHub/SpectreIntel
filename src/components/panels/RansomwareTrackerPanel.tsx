import { useEffect, useState } from 'react';
import { useCyberStore } from '@/store';
import { filterByTime } from '@/utils/time-filter';
import { formatDistanceToNow } from 'date-fns';
import type { ThreatCluster } from '@/types';

/**
 * Ransomware Tracker — Active groups and recent victims.
 * Derives ransomware intelligence from the threat feed clusters.
 *
 * In production, this would additionally pull from:
 * - Ransomwatch (ransomware leak site monitoring)
 * - DarkFeed
 * - ID Ransomware
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

const RANSOMWARE_PATTERNS: { name: string; patterns: RegExp[]; colour: string }[] = [
  { name: 'LockBit', patterns: [/lockbit/i], colour: '#E00000' },
  { name: 'BlackCat/ALPHV', patterns: [/blackcat/i, /alphv/i], colour: '#E01515' },
  { name: 'Cl0p', patterns: [/cl0p/i, /clop/i], colour: '#D43A1A' },
  { name: 'Play', patterns: [/\bplay\b.*ransomware/i, /play\s+group/i], colour: '#D43A1A' },
  { name: 'Black Basta', patterns: [/black\s*basta/i], colour: '#E01515' },
  { name: 'Akira', patterns: [/akira.*ransomware/i, /akira.*attack/i], colour: '#8B0A0A' },
  { name: 'RansomHub', patterns: [/ransomhub/i], colour: '#8B0A0A' },
  { name: 'Medusa', patterns: [/medusa.*ransomware/i, /medusa.*attack/i], colour: '#8B0A0A' },
  { name: 'Generic', patterns: [/ransomware/i], colour: '#8A8F98' },
];

function extractRansomwareData(clusters: ThreatCluster[]): GroupSummary[] {
  const groupMap = new Map<string, RansomwareHit[]>();

  for (const cluster of clusters) {
    const text = `${cluster.primary.title} ${cluster.primary.description}`;

    for (const { name, patterns } of RANSOMWARE_PATTERNS) {
      const matched = patterns.some((p) => p.test(text));
      if (matched) {
        // Skip "Generic" if a specific group was already matched
        if (name === 'Generic') {
          const specificMatch = RANSOMWARE_PATTERNS
            .filter((r) => r.name !== 'Generic')
            .some((r) => r.patterns.some((p) => p.test(text)));
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
        break; // One group per cluster
      }
    }
  }

  const summaries: GroupSummary[] = [];
  for (const { name, colour } of RANSOMWARE_PATTERNS) {
    const hits = groupMap.get(name) || [];
    if (hits.length > 0) {
      summaries.push({ name, colour, hits, count: hits.length });
    }
  }

  summaries.sort((a, b) => b.count - a.count);
  return summaries;
}

export function RansomwareTrackerPanel() {
  const { clusters, timeFilter } = useCyberStore();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (clusters.length === 0) return;
    const filteredClusters = filterByTime(clusters, timeFilter, (c) => c.primary.publishedAt);
    setGroups(extractRansomwareData(filteredClusters));
  }, [clusters, timeFilter]);

  const totalHits = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '250px', flexShrink: 0 }}>
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">🔒 RANSOMWARE TRACKER</span>
        <span className="text-[9px] font-mono text-gray-500">
          {totalHits} hits
        </span>
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
            {/* Active Groups Summary */}
            <div className="text-[8px] font-mono text-gray-500 uppercase tracking-wider px-1 mb-1">
              Active Groups
            </div>

            {groups.map((group) => {
              const barWidth = Math.max((group.count / Math.max(...groups.map((g) => g.count), 1)) * 100, 10);
              const isExpanded = expanded === group.name;

              return (
                <div key={group.name}>
                  {/* Group bar */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : group.name)}
                    className="w-full flex items-center gap-2 px-1.5 py-1 rounded-sm hover:bg-cyber-hover/50 transition-all"
                  >
                    <span className="text-[10px] font-mono text-gray-300 w-24 text-left flex-shrink-0">
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

                  {/* Expanded hits */}
                  {isExpanded && (
                    <div className="pl-4 pr-1 pb-1 space-y-0.5">
                      {group.hits.slice(0, 5).map((hit, i) => (
                        <a
                          key={i}
                          href={hit.link || '#'}
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
