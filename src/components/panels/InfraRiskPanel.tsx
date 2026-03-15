import { useEffect } from 'react';
import { useCyberStore } from '@/store';
import { filterByTime } from '@/utils/time-filter';
import type { ThreatSeverity, SectorRisk } from '@/types';

/**
 * Infrastructure Risk Panel — Per-sector risk levels.
 * Directly from the concept art: Energy (critical), Water (high), Transport (medium), Oil & Gas.
 *
 * Risk is computed from:
 *  - CVEs affecting sector-specific keywords
 *  - Threat feed mentions of sector infrastructure
 *  - Known APT targeting patterns
 */

const SECTOR_KEYWORDS: Record<string, RegExp[]> = {
  'Energy & Power': [/energy/i, /power grid/i, /electric/i, /nuclear/i, /solar/i, /wind farm/i, /scada/i, /turbine/i, /substation/i],
  'Water & Utilities': [/water/i, /utility/i, /sewage/i, /reservoir/i, /treatment plant/i, /desalination/i],
  'Transport': [/transport/i, /rail/i, /airport/i, /aviation/i, /maritime/i, /shipping/i, /port/i, /traffic/i],
  'Oil & Gas': [/oil/i, /gas\b/i, /pipeline/i, /petroleum/i, /refinery/i, /aramco/i, /lng\b/i],
  'Telecommunications': [/telecom/i, /isp\b/i, /mobile network/i, /5g\b/i, /fiber/i, /broadband/i, /bgp/i, /dns\b/i],
  'Healthcare': [/health/i, /hospital/i, /nhs/i, /medical/i, /pharma/i, /patient/i, /clinical/i],
  'Financial Services': [/bank/i, /financ/i, /payment/i, /stock exchange/i, /swift/i, /trading/i, /crypto/i],
  'Government & Defence': [/government/i, /military/i, /defence/i, /defense/i, /pentagon/i, /ministry/i, /intelligence/i, /nato/i],
};

const SECTOR_ICONS: Record<string, string> = {
  'Energy & Power': '⚡',
  'Water & Utilities': '💧',
  'Transport': '🚆',
  'Oil & Gas': '🛢️',
  'Telecommunications': '📡',
  'Healthcare': '🏥',
  'Financial Services': '🏦',
  'Government & Defence': '🏛️',
};

const RISK_COLOURS: Record<string, string> = {
  critical: '#E00000',
  high: '#E01515',
  medium: '#D43A1A',
  low: '#C46A2A',
  minimal: '#4A6B3F',
};

function getRiskLabel(level: number): { label: string; colour: string } {
  if (level >= 80) return { label: 'CRITICAL', colour: RISK_COLOURS.critical };
  if (level >= 60) return { label: 'HIGH', colour: RISK_COLOURS.high };
  if (level >= 40) return { label: 'MEDIUM', colour: RISK_COLOURS.medium };
  if (level >= 20) return { label: 'LOW', colour: RISK_COLOURS.low };
  return { label: 'MINIMAL', colour: RISK_COLOURS.minimal };
}

export function InfraRiskPanel() {
  const { clusters, cves, sectorRisks, setSectorRisks, timeFilter } = useCyberStore();

  // Compute sector risk from live data
  useEffect(() => {
    if (clusters.length === 0) return;

    const filteredClusters = filterByTime(clusters, timeFilter, (c) => c.primary.publishedAt);

    const updatedRisks: SectorRisk[] = Object.entries(SECTOR_KEYWORDS).map(([sector, patterns]) => {
      let mentions = 0;
      let criticalCount = 0;
      const matchedAPTs = new Set<string>();

      // Scan feed clusters
      for (const cluster of filteredClusters) {
        const text = `${cluster.primary.title} ${cluster.primary.description}`;
        for (const pattern of patterns) {
          if (pattern.test(text)) {
            mentions++;
            if (cluster.severity === 'critical') criticalCount++;
            // Check for APT mentions
            const aptMatch = text.match(/apt\d+|lazarus|sandworm|volt typhoon|salt typhoon|turla|kimsuky|oilrig|muddywater|fancy bear|cozy bear/i);
            if (aptMatch) matchedAPTs.add(aptMatch[0]);
            break;
          }
        }
      }

      // Scan CVEs
      let cveMatches = 0;
      for (const cve of cves) {
        const text = `${cve.vendor} ${cve.product} ${cve.description}`;
        for (const pattern of patterns) {
          if (pattern.test(text)) {
            cveMatches++;
            break;
          }
        }
      }

      // Calculate risk score (0-100)
      const mentionScore = Math.min(mentions * 8, 40);
      const criticalScore = Math.min(criticalCount * 15, 30);
      const cveScore = Math.min(cveMatches * 10, 20);
      const aptScore = matchedAPTs.size * 5;
      const riskLevel = Math.min(mentionScore + criticalScore + cveScore + aptScore, 100);

      const topAPT = matchedAPTs.size > 0 ? [...matchedAPTs][0] : null;
      const trend = criticalCount > 2 ? 'rising' as const : mentions > 5 ? 'stable' as const : 'stable' as const;

      return {
        sector,
        icon: SECTOR_ICONS[sector] || '●',
        riskLevel,
        activeThreats: mentions,
        recentIncidents: criticalCount,
        topAPT,
        trend,
      };
    });

    // Sort by risk level descending
    updatedRisks.sort((a, b) => b.riskLevel - a.riskLevel);
    setSectorRisks(updatedRisks);
  }, [clusters, cves, timeFilter, setSectorRisks]); // cves intentionally unfiltered (catalog, not stream)

  return (
    <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '280px', flexShrink: 0 }}>
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">⚡ INFRA RISK</span>
        <span className="text-[9px] font-mono text-gray-500">
          {sectorRisks.filter((s) => s.riskLevel >= 60).length} elevated
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sectorRisks.map((sector) => {
          const { label, colour } = getRiskLabel(sector.riskLevel);

          return (
            <div key={sector.sector}>
              {/* Sector header */}
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs">{sector.icon}</span>
                  <span className="text-[9px] font-mono text-gray-300">{sector.sector}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-[7px] font-mono font-bold px-1 py-0.5 rounded-sm"
                    style={{ color: colour, background: `${colour}15`, border: `1px solid ${colour}30` }}
                  >
                    {label}
                  </span>
                  {sector.trend === 'rising' && (
                    <span className="text-[8px] text-threat-high">▲</span>
                  )}
                </div>
              </div>

              {/* Risk bar */}
              <div className="h-1.5 bg-cyber-card rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${sector.riskLevel}%`,
                    background: `linear-gradient(90deg, ${colour}80, ${colour})`,
                    boxShadow: sector.riskLevel >= 60 ? `0 0 6px ${colour}40` : 'none',
                  }}
                />
              </div>

              {/* Details row */}
              <div className="flex items-center gap-2 mt-0.5 text-[7px] font-mono text-gray-600">
                <span>{sector.activeThreats} threats</span>
                {sector.recentIncidents > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-threat-critical">{sector.recentIncidents} critical</span>
                  </>
                )}
                {sector.topAPT && (
                  <>
                    <span>·</span>
                    <span className="text-accent-purple">{sector.topAPT}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
