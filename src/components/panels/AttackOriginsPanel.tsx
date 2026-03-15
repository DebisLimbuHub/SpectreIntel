import { useCyberStore } from '@/store';
import { filterByTime } from '@/utils/time-filter';
import type { ThreatCluster } from '@/types';

/**
 * Attack Origins Panel — Country-level attack attribution.
 * Inspired by the concept art showing Russia 127, China 76, Iran 24.
 *
 * Counts are derived from threat feed keyword analysis.
 */

const COUNTRY_KEYWORDS: { country: string; flag: string; keywords: RegExp[] }[] = [
  {
    country: 'Russia',
    flag: '🇷🇺',
    keywords: [/russia/i, /apt28/i, /apt29/i, /fancy bear/i, /cozy bear/i, /sandworm/i, /turla/i, /gru/i, /svr/i, /kremlin/i, /moscow/i, /forest blizzard/i, /midnight blizzard/i],
  },
  {
    country: 'China',
    flag: '🇨🇳',
    keywords: [/china/i, /chinese/i, /apt41/i, /apt10/i, /apt1/i, /volt typhoon/i, /salt typhoon/i, /winnti/i, /pla\b/i, /mss\b/i, /beijing/i, /panda/i, /typhoon/i],
  },
  {
    country: 'North Korea',
    flag: '🇰🇵',
    keywords: [/north korea/i, /dprk/i, /lazarus/i, /kimsuky/i, /hidden cobra/i, /pyongyang/i, /chollima/i, /rgb\b/i],
  },
  {
    country: 'Iran',
    flag: '🇮🇷',
    keywords: [/iran/i, /iranian/i, /apt33/i, /apt34/i, /apt35/i, /oilrig/i, /charming kitten/i, /muddywater/i, /irgc/i, /mois/i, /tehran/i, /kitten/i, /sandstorm/i],
  },
];

function countCountryMentions(clusters: ThreatCluster[]): { country: string; flag: string; count: number; trend: string }[] {
  const counts: Record<string, number> = {};

  for (const cluster of clusters) {
    const text = `${cluster.primary.title} ${cluster.primary.description}`;
    for (const { country, keywords } of COUNTRY_KEYWORDS) {
      for (const kw of keywords) {
        if (kw.test(text)) {
          counts[country] = (counts[country] || 0) + 1;
          break; // Count each cluster only once per country
        }
      }
    }
  }

  return COUNTRY_KEYWORDS.map(({ country, flag }) => ({
    country,
    flag,
    count: counts[country] || 0,
    trend: counts[country] && counts[country] > 3 ? 'rising' : 'stable',
  })).sort((a, b) => b.count - a.count);
}

export function AttackOriginsPanel() {
  const { clusters, timeFilter } = useCyberStore();
  const filteredClusters = filterByTime(clusters, timeFilter, (c) => c.primary.publishedAt);
  const origins = countCountryMentions(filteredClusters);
  const totalMentions = origins.reduce((sum, o) => sum + o.count, 0);

  return (
    <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '250px', flexShrink: 0 }}>
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">🌍 ATTACK ORIGINS</span>
        <span className="text-[9px] font-mono text-gray-500">
          {totalMentions} mentions
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {origins.map(({ country, flag, count, trend }) => {
          const maxCount = Math.max(...origins.map((o) => o.count), 1);
          const barWidth = count > 0 ? Math.max((count / maxCount) * 100, 8) : 0;

          return (
            <div key={country}>
              {/* Country row */}
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{flag}</span>
                  <span className="text-[10px] font-mono text-gray-300">{country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-semibold text-gray-200">
                    {count}
                  </span>
                  <span className="text-[8px] font-mono text-gray-600">mentions</span>
                  {trend === 'rising' && (
                    <span className="text-[8px] text-threat-high">▲</span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="h-1 bg-cyber-card rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barWidth}%`,
                    background: country === 'Russia' ? '#E00000' :
                               country === 'China' ? '#D43A1A' :
                               country === 'North Korea' ? '#C46A2A' :
                               '#8B0A0A',
                  }}
                />
              </div>
            </div>
          );
        })}

        {totalMentions === 0 && (
          <div className="text-center py-2">
            <span className="text-gray-600 text-[10px] font-mono">Analysing feeds...</span>
          </div>
        )}
      </div>
    </div>
  );
}
