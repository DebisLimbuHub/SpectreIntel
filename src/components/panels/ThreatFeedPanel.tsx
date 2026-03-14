import { useCyberStore } from '@/store';
import { sanitiseUrl, truncate } from '@/utils/sanitise';
import { formatDistanceToNow } from 'date-fns';
import type { ThreatCluster, ThreatSeverity } from '@/types';

/**
 * Threat Intel Feed Panel — Live clustered cyber news.
 * Displays Jaccard-clustered news items ranked by severity and source tier.
 */

const SEVERITY_CONFIG: Record<ThreatSeverity, { label: string; colour: string; bg: string; border: string }> = {
  critical: { label: 'CRIT', colour: '#ff1744', bg: 'rgba(255,23,68,0.1)', border: 'rgba(255,23,68,0.3)' },
  high: { label: 'HIGH', colour: '#ff5722', bg: 'rgba(255,87,34,0.1)', border: 'rgba(255,87,34,0.3)' },
  medium: { label: 'MED', colour: '#ff9800', bg: 'rgba(255,152,0,0.1)', border: 'rgba(255,152,0,0.3)' },
  low: { label: 'LOW', colour: '#ffc107', bg: 'rgba(255,193,7,0.1)', border: 'rgba(255,193,7,0.3)' },
  info: { label: 'INFO', colour: '#00bcd4', bg: 'rgba(0,188,212,0.1)', border: 'rgba(0,188,212,0.3)' },
};

export function ThreatFeedPanel() {
  const { clusters } = useCyberStore();

  return (
    <div className="hud-panel h-full flex flex-col overflow-hidden">
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">📡 THREAT INTEL FEED</span>
        <span className="text-[9px] font-mono text-gray-500">
          {clusters.length} clusters
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {clusters.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-gray-600 text-xs font-mono">Fetching feeds...</span>
            <div className="mt-2 flex justify-center">
              <div className="w-4 h-4 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div className="p-1 space-y-1">
            {clusters.slice(0, 25).map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: ThreatCluster }) {
  const { primary, related, sourceCount, velocity, severity } = cluster;
  const config = SEVERITY_CONFIG[severity];
  const timeAgo = safeTimeAgo(primary.publishedAt);
  const url = sanitiseUrl(primary.link);

  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-2 rounded-sm border border-cyber-border hover:border-cyber-border-active hover:bg-cyber-hover/50 transition-all group"
    >
      {/* Top row: severity + source count + velocity */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
          style={{ color: config.colour, background: config.bg, border: `1px solid ${config.border}` }}
        >
          {config.label}
        </span>

        {sourceCount > 1 && (
          <span className="text-[8px] font-mono text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 px-1 py-0.5 rounded-sm">
            {sourceCount} src
          </span>
        )}

        {velocity.level !== 'normal' && (
          <span className="text-[8px] font-mono text-threat-high bg-threat-high/10 border border-threat-high/20 px-1 py-0.5 rounded-sm">
            {velocity.level === 'spike' ? '🔥 SPIKE' : '📈 RISING'}
          </span>
        )}

        {primary.cves && primary.cves.length > 0 && (
          <span className="text-[8px] font-mono text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-1 py-0.5 rounded-sm">
            {primary.cves[0]}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-[11px] font-mono text-gray-300 leading-tight group-hover:text-accent-cyan transition-colors mb-1">
        {truncate(primary.title, 100)}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 text-[9px] font-mono text-gray-600">
        <span className="text-gray-500">{primary.source}</span>
        <span>·</span>
        <span>{timeAgo}</span>
        {related.length > 0 && (
          <>
            <span>·</span>
            <span className="text-gray-500">
              +{related.length} related
            </span>
          </>
        )}
      </div>

      {/* Related sources (collapsed) */}
      {related.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {related.slice(0, 3).map((r, i) => (
            <span key={i} className="text-[8px] font-mono text-gray-600">
              {r.source}
            </span>
          ))}
        </div>
      )}
    </a>
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
