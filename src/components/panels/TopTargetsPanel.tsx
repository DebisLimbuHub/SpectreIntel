import { useCyberStore } from '@/store';
import { APT_GROUPS } from '@/config/apt-groups';
import { filterByTime } from '@/utils/time-filter';
import type { ThreatCluster } from '@/types';

/**
 * Top Targets Panel — Most targeted entities derived from threat feeds.
 * Inspired by the concept art: US Power Grid → APT28, German Water → China Group, etc.
 *
 * Extracts target + attacker pairs from news clusters using keyword matching.
 */

interface TargetEntry {
  target: string;
  country: string;
  flag: string;
  sector: string;
  attacker: string;
  attackerCountry: string;
  severity: string;
  sourceCount: number;
}

const TARGET_PATTERNS: { target: string; country: string; flag: string; sector: string; keywords: RegExp[] }[] = [
  { target: 'US Power Grid', country: 'US', flag: '🇺🇸', sector: 'Energy', keywords: [/us.*power/i, /us.*grid/i, /american.*energy/i, /us.*electric/i] },
  { target: 'US Government', country: 'US', flag: '🇺🇸', sector: 'Government', keywords: [/us.*government/i, /federal.*agency/i, /white house/i, /pentagon/i, /us.*department/i, /united states/i, /american/i, /washington/i, /congress/i, /senate/i, /fbi\b/i, /cia\b/i, /nsa\b/i] },
  { target: 'US Telecom', country: 'US', flag: '🇺🇸', sector: 'Telecom', keywords: [/us.*telecom/i, /american.*isp/i, /us.*carrier/i, /att\b/i, /verizon/i, /t-mobile/i, /telecom/i, /network.*attack/i, /isp/i] },
  { target: 'UK Infrastructure', country: 'UK', flag: '🇬🇧', sector: 'Critical Infra', keywords: [/uk.*infra/i, /british.*water/i, /nhs/i, /uk.*energy/i, /london.*water/i, /united kingdom/i, /british/i, /england/i, /scotland/i] },
  { target: 'German Industry', country: 'DE', flag: '🇩🇪', sector: 'Manufacturing', keywords: [/german.*industr/i, /german.*water/i, /german.*energy/i, /germany.*utility/i] },
  { target: 'NATO Members', country: 'NATO', flag: '🏛️', sector: 'Defence', keywords: [/nato/i, /alliance.*member/i, /nato.*country/i, /europe.*attack/i, /eu\b.*cyber/i, /western.*allies/i] },
  { target: 'Ukraine', country: 'UA', flag: '🇺🇦', sector: 'Government', keywords: [/ukrain/i, /kyiv/i, /ukrainian/i, /russian.*attack/i, /war.*cyber/i] },
  { target: 'Taiwan / TSMC', country: 'TW', flag: '🇹🇼', sector: 'Semiconductor', keywords: [/taiwan/i, /tsmc/i, /taiwanese/i] },
  { target: 'Saudi Energy', country: 'SA', flag: '🇸🇦', sector: 'Energy', keywords: [/saudi/i, /aramco/i, /riyadh/i] },
  { target: 'Israel', country: 'IL', flag: '🇮🇱', sector: 'Multi-sector', keywords: [/israel/i, /israeli/i, /tel aviv/i] },
  { target: 'South Korea', country: 'KR', flag: '🇰🇷', sector: 'Finance/Tech', keywords: [/south korea/i, /korean.*bank/i, /seoul/i, /korean.*railway/i] },
  { target: 'Japan Defence', country: 'JP', flag: '🇯🇵', sector: 'Defence', keywords: [/japan/i, /japanese.*defence/i, /tokyo.*cyber/i] },
  { target: 'Healthcare Sector', country: 'GLOBAL', flag: '🏥', sector: 'Healthcare', keywords: [/hospital/i, /health.*care/i, /medical/i, /patient.*data/i, /pharma/i] },
  { target: 'Financial Sector', country: 'GLOBAL', flag: '🏦', sector: 'Finance', keywords: [/bank/i, /financ/i, /payment/i, /credit.*card/i, /swift/i, /crypto.*exchange/i, /defi/i] },
  { target: 'Tech Companies', country: 'GLOBAL', flag: '💻', sector: 'Technology', keywords: [/microsoft/i, /google/i, /apple/i, /amazon/i, /meta\b/i, /oracle/i, /cisco/i, /fortinet/i, /palo alto/i, /ivanti/i] },
  { target: 'Education', country: 'GLOBAL', flag: '🎓', sector: 'Education', keywords: [/university/i, /school/i, /education/i, /academic/i, /student/i] },
  { target: 'Critical Infrastructure', country: 'GLOBAL', flag: '🏗️', sector: 'Infrastructure', keywords: [/infrastructure/i, /scada/i, /ics\b/i, /ot\b.*security/i, /operational.*technology/i, /power.*grid/i, /water.*treatment/i] },
];

const ATTACKER_PATTERNS: { name: string; country: string; keywords: RegExp[] }[] = [
  { name: 'APT28', country: 'Russia', keywords: [/apt28/i, /fancy bear/i, /forest blizzard/i] },
  { name: 'APT29', country: 'Russia', keywords: [/apt29/i, /cozy bear/i, /midnight blizzard/i] },
  { name: 'Sandworm', country: 'Russia', keywords: [/sandworm/i, /seashell blizzard/i] },
  { name: 'Volt Typhoon', country: 'China', keywords: [/volt typhoon/i] },
  { name: 'Salt Typhoon', country: 'China', keywords: [/salt typhoon/i] },
  { name: 'Lazarus', country: 'N. Korea', keywords: [/lazarus/i, /hidden cobra/i] },
  { name: 'APT33', country: 'Iran', keywords: [/apt33/i, /elfin/i, /peach sandstorm/i] },
  { name: 'APT35', country: 'Iran', keywords: [/apt35/i, /charming kitten/i, /mint sandstorm/i] },
  { name: 'Russia', country: 'Russia', keywords: [/russia/i, /russian/i, /kremlin/i] },
  { name: 'China', country: 'China', keywords: [/china/i, /chinese/i, /beijing/i, /pla\b/i] },
  { name: 'Iran', country: 'Iran', keywords: [/iran/i, /iranian/i, /tehran/i, /irgc/i] },
  { name: 'N. Korea', country: 'N. Korea', keywords: [/north korea/i, /dprk/i, /pyongyang/i] },
  { name: 'Ransomware', country: 'Unknown', keywords: [/ransomware/i, /lockbit/i, /blackcat/i, /alphv/i, /cl0p/i, /play.*ransom/i, /akira/i] },
  { name: 'Hacktivists', country: 'Unknown', keywords: [/hacktivist/i, /anonymous/i, /ddos.*attack/i, /defac/i] },
  { name: 'Unknown Actor', country: 'Unknown', keywords: [/threat.*actor/i, /attacker/i, /hacker/i, /breach/i, /exploit.*attack/i, /zero.*day/i] },
];

function extractTopTargets(clusters: ThreatCluster[]): TargetEntry[] {
  const targets = new Map<string, TargetEntry>();

  for (const cluster of clusters) {
    const text = `${cluster.primary.title} ${cluster.primary.description}`;

    for (const tp of TARGET_PATTERNS) {
      if (!tp.keywords.some((k) => k.test(text))) continue;

      // Find attacker
      let attacker = 'Unknown';
      let attackerCountry = '';
      for (const ap of ATTACKER_PATTERNS) {
        if (ap.keywords.some((k) => k.test(text))) {
          attacker = ap.name;
          attackerCountry = ap.country;
          break;
        }
      }

      const key = `${tp.target}-${attacker}`;
      const existing = targets.get(key);
      if (existing) {
        existing.sourceCount++;
        if (cluster.severity === 'critical') existing.severity = 'critical';
      } else {
        targets.set(key, {
          target: tp.target,
          country: tp.country,
          flag: tp.flag,
          sector: tp.sector,
          attacker,
          attackerCountry,
          severity: cluster.severity,
          sourceCount: 1,
        });
      }
    }
  }

  return [...targets.values()]
    .sort((a, b) => b.sourceCount - a.sourceCount)
    .slice(0, 8);
}

const ATTACKER_COLOURS: Record<string, string> = {
  Russia: '#E00000',
  China: '#D43A1A',
  'N. Korea': '#C46A2A',
  Iran: '#8B0A0A',
};

export function TopTargetsPanel() {
  const { clusters, timeFilter } = useCyberStore();
  const filteredClusters = filterByTime(clusters, timeFilter, (c) => c.primary.publishedAt);
  const targets = extractTopTargets(filteredClusters);

  const displayTargets = targets.length > 0 ? targets : filteredClusters
    .filter((c) => c.severity === 'critical' || c.severity === 'high')
    .slice(0, 6)
    .map((c) => ({
      target: c.primary.title.length > 45 ? c.primary.title.slice(0, 45) + '...' : c.primary.title,
      country: '',
      flag: '🎯',
      sector: 'Threat',
      attacker: c.primary.source,
      attackerCountry: '',
      severity: c.severity,
      sourceCount: c.sourceCount,
    }));

  return (
    <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '160px' }}>
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">🎯 TOP TARGETS</span>
        <span className="text-[9px] font-mono text-gray-500">{displayTargets.length} pairs</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayTargets.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-gray-600 text-[10px] font-mono">Analysing feeds...</span>
          </div>
        ) : (
          <div className="p-1 space-y-0.5">
            {displayTargets.map((t, i) => {
              const atkColour = ATTACKER_COLOURS[t.attackerCountry] || '#8A8F98';
              return (
                <div
                  key={`${t.target}-${t.attacker}-${i}`}
                  className="flex items-center gap-2 px-1.5 py-1.5 rounded-sm hover:bg-cyber-hover/50 transition-colors"
                >
                  {/* Target */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{t.flag}</span>
                      <span className="text-[9px] font-mono text-gray-300 truncate">{t.target}</span>
                    </div>
                    <span className="text-[7px] font-mono text-gray-600">{t.sector}</span>
                  </div>

                  {/* Arrow */}
                  <span className="text-[8px] text-gray-600 flex-shrink-0">←</span>

                  {/* Attacker */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
                      style={{ color: atkColour, background: `${atkColour}15`, border: `1px solid ${atkColour}30` }}
                    >
                      {t.attacker}
                    </span>
                  </div>

                  {/* Count */}
                  <span className="text-[8px] font-mono text-gray-500 flex-shrink-0 w-4 text-right">
                    {t.sourceCount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
