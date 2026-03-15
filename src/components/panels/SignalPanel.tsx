import { useCyberStore } from '@/store';
import { SIGNAL_CONFIGS } from '@/services/correlation';
import { formatDistanceToNow } from 'date-fns';
import type { CyberSignal, ThreatSeverity } from '@/types';

/**
 * Signal Intelligence Panel — Active signal detections.
 * Shows convergence, triangulation, velocity spike, and other correlation signals.
 * Adapted from WorldMonitor's signal chain display.
 */

const SEVERITY_COLOURS: Record<ThreatSeverity, string> = {
  critical: '#E00000',
  high: '#E01515',
  medium: '#D43A1A',
  low: '#C46A2A',
  info: '#8A8F98',
};

export function SignalPanel() {
  const { signals } = useCyberStore();
  const activeSignals = signals.filter((s) => new Date(s.expiresAt) > new Date());

  return (
    <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '220px', flexShrink: 0 }}>
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">⚡ SIGNALS</span>
        <div className="flex items-center gap-1">
          {activeSignals.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          )}
          <span className="text-[9px] font-mono text-gray-500">
            {activeSignals.length} active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeSignals.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-gray-600 text-[10px] font-mono">No active signals</span>
            <p className="text-gray-700 text-[8px] font-mono mt-1">
              Signals trigger when multiple feeds converge, velocity spikes, or triangulation occurs
            </p>
          </div>
        ) : (
          <div className="p-1 space-y-1">
            {activeSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: CyberSignal }) {
  const config = SIGNAL_CONFIGS[signal.type];
  const colour = SEVERITY_COLOURS[signal.severity];
  const timeAgo = safeTimeAgo(signal.timestamp);

  return (
    <div
      className="p-2 rounded-sm border border-cyber-border hover:border-cyber-border-active transition-all"
      style={{ borderLeftColor: colour, borderLeftWidth: '2px' }}
    >
      {/* Header: icon + type + confidence */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{config.icon}</span>
          <span className="text-[9px] font-mono font-semibold text-gray-300 uppercase">
            {config.name}
          </span>
        </div>
        <span
          className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
          style={{ color: colour, background: `${colour}15`, border: `1px solid ${colour}30` }}
        >
          {signal.confidence}%
        </span>
      </div>

      {/* Title */}
      <p className="text-[10px] font-mono text-gray-400 leading-tight mb-1">
        {signal.title}
      </p>

      {/* Description */}
      <p className="text-[8px] font-mono text-gray-600 leading-tight mb-1">
        {signal.description}
      </p>

      {/* Related CVEs / APTs */}
      <div className="flex flex-wrap gap-1 mb-1">
        {signal.relatedCVEs?.slice(0, 2).map((cve) => (
          <span key={cve} className="text-[7px] font-mono text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-1 py-0.5 rounded-sm">
            {cve}
          </span>
        ))}
        {signal.relatedAPTs?.slice(0, 2).map((apt) => (
          <span key={apt} className="text-[7px] font-mono text-threat-critical bg-threat-critical/10 border border-threat-critical/20 px-1 py-0.5 rounded-sm">
            {apt}
          </span>
        ))}
      </div>

      {/* Footer: time + sources */}
      <div className="text-[7px] font-mono text-gray-600">
        {timeAgo} · {signal.sources.slice(0, 3).join(', ')}
      </div>
    </div>
  );
}

/**
 * Compact signal badge for the header bar.
 * Shows count + expandable list on click.
 */
export function SignalBadge() {
  const { signals } = useCyberStore();
  const activeSignals = signals.filter((s) => new Date(s.expiresAt) > new Date());
  const criticalSignals = activeSignals.filter((s) => s.severity === 'critical');

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm hover:bg-cyber-hover transition-colors cursor-pointer">
      <span className="text-xs">⚡</span>
      <span className="text-[10px] font-mono text-gray-400">
        {activeSignals.length} SIGNAL{activeSignals.length !== 1 ? 'S' : ''}
      </span>
      {criticalSignals.length > 0 && (
        <span className="text-[8px] font-mono text-threat-critical bg-threat-critical/10 border border-threat-critical/30 px-1 py-0.5 rounded-sm animate-pulse">
          {criticalSignals.length} CRIT
        </span>
      )}
      {activeSignals.length > 0 && (
        <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
      )}
    </div>
  );
}

function safeTimeAgo(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'just now';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'just now';
  }
}
