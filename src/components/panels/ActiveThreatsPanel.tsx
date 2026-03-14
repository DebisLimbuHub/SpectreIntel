import { useCyberStore } from '@/store';
import { truncate } from '@/utils/sanitise';
import { formatDistanceToNow } from 'date-fns';
import type { ThreatSeverity } from '@/types';

/**
 * Active Threats Panel — Highest severity items from the threat feed.
 * Inspired by the concept art's "Active Threats (24h)" panel.
 */

const SEVERITY_DOT: Record<ThreatSeverity, string> = {
  critical: '#ff1744',
  high: '#ff5722',
  medium: '#ff9800',
  low: '#ffc107',
  info: '#00bcd4',
};

export function ActiveThreatsPanel() {
  const { clusters } = useCyberStore();

  // Filter to critical + high severity only
  const activeThreats = clusters
    .filter((c) => c.severity === 'critical' || c.severity === 'high')
    .slice(0, 8);

  const critCount = clusters.filter((c) => c.severity === 'critical').length;
  const highCount = clusters.filter((c) => c.severity === 'high').length;

  return (
    <div className="hud-panel h-full flex flex-col overflow-hidden">
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">🎯 ACTIVE THREATS (24H)</span>
        <div className="flex items-center gap-1.5">
          {critCount > 0 && (
            <span className="text-[8px] font-mono text-threat-critical bg-threat-critical/10 border border-threat-critical/30 px-1 py-0.5 rounded-sm">
              {critCount} CRIT
            </span>
          )}
          {highCount > 0 && (
            <span className="text-[8px] font-mono text-threat-high bg-threat-high/10 border border-threat-high/30 px-1 py-0.5 rounded-sm">
              {highCount} HIGH
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeThreats.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-gray-600 text-xs font-mono">Scanning feeds...</span>
          </div>
        ) : (
          <div className="p-1 space-y-0.5">
            {activeThreats.map((cluster) => {
              const colour = SEVERITY_DOT[cluster.severity];
              const timeAgo = safeTimeAgo(cluster.primary.publishedAt);

              return (
                <div
                  key={cluster.id}
                  className="flex items-start gap-2 p-1.5 rounded-sm hover:bg-cyber-hover/50 transition-colors"
                >
                  {/* Severity dot with pulse for critical */}
                  <div className="mt-1 flex-shrink-0">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        cluster.severity === 'critical' ? 'animate-threat-pulse' : ''
                      }`}
                      style={{ background: colour, boxShadow: `0 0 6px ${colour}60` }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-gray-300 leading-tight">
                      {truncate(cluster.primary.title, 80)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[8px] font-mono text-gray-600">
                      <span>{cluster.primary.source}</span>
                      <span>·</span>
                      <span>{timeAgo}</span>
                      {cluster.sourceCount > 1 && (
                        <>
                          <span>·</span>
                          <span className="text-accent-cyan">{cluster.sourceCount} src</span>
                        </>
                      )}
                    </div>
                  </div>
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
