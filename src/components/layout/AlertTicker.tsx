import { useState } from 'react';
import { useCyberStore } from '@/store';

/**
 * Alert Ticker — Scrolling alert bar at the bottom of the dashboard.
 * Phase 5: Slow readable speed (180s), tight gaps, hover-to-pause.
 */

const DEMO_ALERTS = [
  { id: 'd1', text: 'CISA adds 3 CVEs to Known Exploited Vulnerabilities catalogue', severity: 'critical' as const, icon: '🔴', timestamp: new Date(), source: 'CISA' },
  { id: 'd2', text: 'Volt Typhoon activity detected targeting US water treatment facilities', severity: 'critical' as const, icon: '🔴', timestamp: new Date(), source: 'Mandiant' },
  { id: 'd3', text: 'LockBit 4.0 claims UK energy provider — 3TB data allegedly exfiltrated', severity: 'high' as const, icon: '🟠', timestamp: new Date(), source: 'The Record' },
  { id: 'd4', text: 'BGP hijack detected on AS174 (Cogent) affecting EU routing', severity: 'high' as const, icon: '🟠', timestamp: new Date(), source: 'BGPStream' },
  { id: 'd5', text: 'APT28 phishing campaign targeting NATO member defence ministries', severity: 'critical' as const, icon: '🔴', timestamp: new Date(), source: 'NCSC' },
  { id: 'd6', text: 'Internet outage detected in Sudan — 98% connectivity loss', severity: 'medium' as const, icon: '🟡', timestamp: new Date(), source: 'Cloudflare Radar' },
  { id: 'd7', text: 'Microsoft Patch Tuesday: 4 zero-days addressed, 2 actively exploited', severity: 'critical' as const, icon: '🔴', timestamp: new Date(), source: 'MSRC' },
  { id: 'd8', text: 'Ransomware hits London water supply control systems — SCADA compromise suspected', severity: 'critical' as const, icon: '🔴', timestamp: new Date(), source: 'BleepingComputer' },
];

export function AlertTicker() {
  const { alerts } = useCyberStore();
  const displayAlerts = alerts.length > 0 ? alerts : DEMO_ALERTS;
  const [paused, setPaused] = useState(false);

  return (
    <div className="h-7 bg-cyber-panel border-t border-threat-critical/20 flex items-center overflow-hidden flex-shrink-0 relative">
      {/* Label */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 border-r border-cyber-border bg-threat-critical/5 h-full z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-threat-critical animate-threat-pulse" />
        <span className="text-[10px] font-mono font-semibold text-threat-critical tracking-wider">
          LATEST ALERTS
        </span>
      </div>

      {/* Scrolling Content — hover to pause */}
      <div
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-cyber-panel to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-cyber-panel to-transparent z-10 pointer-events-none" />

        <div
          className="animate-ticker-scroll whitespace-nowrap inline-flex items-center gap-4 h-full"
          style={{ animationPlayState: paused ? 'paused' : 'running' }}
        >
          {/* Duplicate alerts for seamless loop */}
          {[...displayAlerts, ...displayAlerts].map((alert, i) => (
            <span
              key={`${alert.id}-${i}`}
              className="inline-flex items-center gap-1.5"
            >
              <SeverityDot severity={alert.severity} />
              <span className="text-[11px] font-mono text-gray-400">
                {alert.icon}
              </span>
              <span className={`text-[11px] font-mono ${
                alert.severity === 'critical' ? 'text-threat-critical' :
                alert.severity === 'high' ? 'text-threat-high' :
                'text-gray-400'
              }`}>
                {alert.text}
              </span>
              <span className="text-[9px] font-mono text-gray-600">
                [{alert.source}]
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Pause indicator */}
      {paused && (
        <div className="flex-shrink-0 px-2 text-[8px] font-mono text-gray-500">
          ⏸ PAUSED
        </div>
      )}
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colour =
    severity === 'critical' ? 'bg-threat-critical' :
    severity === 'high' ? 'bg-threat-high' :
    severity === 'medium' ? 'bg-threat-medium' :
    'bg-gray-500';

  return (
    <span className={`w-1 h-1 rounded-full ${colour} ${
      severity === 'critical' ? 'animate-threat-pulse' : ''
    }`} />
  );
}
