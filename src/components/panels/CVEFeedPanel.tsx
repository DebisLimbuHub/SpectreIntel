import { useCyberStore } from '@/store';
import { formatDistanceToNow } from 'date-fns';
import type { CVEEntry, ThreatSeverity } from '@/types';

/**
 * CVE Feed Panel — Live vulnerability intelligence.
 * Shows recent CVEs from CISA KEV with severity colour-coding.
 */

const SEVERITY_COLOURS: Record<ThreatSeverity, string> = {
  critical: '#E00000',
  high: '#E01515',
  medium: '#D43A1A',
  low: '#C46A2A',
  info: '#8A8F98',
};

export function CVEFeedPanel() {
  const { cves } = useCyberStore();

  return (
    <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '350px', flexShrink: 0 }}>
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">🐛 CVE FEED</span>
        <span className="text-[9px] font-mono text-gray-500">
          {cves.length} vulns
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cves.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-gray-600 text-xs font-mono">Loading CVE data...</span>
          </div>
        ) : (
          <div className="p-1 space-y-0.5">
            {cves.slice(0, 20).map((cve) => (
              <CVECard key={cve.id} cve={cve} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CVECard({ cve }: { cve: CVEEntry }) {
  const colour = SEVERITY_COLOURS[cve.severity];
  const timeAgo = safeTimeAgo(cve.publishedDate);

  return (
    <div className="p-2 rounded-sm border border-cyber-border hover:border-cyber-border-active hover:bg-cyber-hover/50 transition-all">
      {/* CVE ID + CVSS badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono font-semibold" style={{ color: colour }}>
          {cve.id}
        </span>
        <div className="flex items-center gap-1">
          {cve.isKEV && (
            <span className="text-[7px] font-mono font-bold text-threat-critical bg-threat-critical/10 border border-threat-critical/30 px-1 py-0.5 rounded-sm">
              KEV
            </span>
          )}
          <span
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
            style={{
              color: colour,
              background: `${colour}15`,
              border: `1px solid ${colour}40`,
            }}
          >
            {cve.cvssScore.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Vendor + Product */}
      <div className="text-[9px] font-mono text-accent-cyan mb-0.5">
        {cve.vendor} — {cve.product}
      </div>

      {/* Description */}
      <p className="text-[10px] font-mono text-gray-400 leading-tight mb-1 line-clamp-2">
        {cve.description}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-2 text-[8px] font-mono text-gray-600">
        <span>{timeAgo}</span>
        {cve.isExploitedInWild && (
          <>
            <span>·</span>
            <span className="text-threat-critical">⚡ Exploited in wild</span>
          </>
        )}
        {cve.patchAvailable && (
          <>
            <span>·</span>
            <span className="text-threat-safe">✓ Patch available</span>
          </>
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
