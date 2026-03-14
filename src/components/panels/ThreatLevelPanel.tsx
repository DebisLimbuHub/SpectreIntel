import { useCyberStore } from '@/store';
import { DEFCON_LABELS } from '@/services/threat-level';

/**
 * Threat Level Gauge — Semicircular 0-10 gauge.
 * Directly inspired by the concept art's "THREAT LEVEL: HIGH / 8.7 / CRITICAL" gauge.
 *
 * SVG arc gauge with gradient colouring, animated needle, and DEFCON label.
 */

export function ThreatLevelPanel() {
  const { threatLevel } = useCyberStore();

  if (!threatLevel) {
    return (
      <div className="hud-panel h-full flex flex-col overflow-hidden">
        <div className="hud-panel-header flex-shrink-0">
          <span className="hud-panel-title">🎚️ THREAT LEVEL</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-5 h-5 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin mx-auto mb-2" />
            <span className="text-gray-600 text-[10px] font-mono">Calculating...</span>
          </div>
        </div>
      </div>
    );
  }

  const { score, label, defconLevel, trend, components } = threatLevel;
  const defcon = DEFCON_LABELS[defconLevel];

  // Gauge geometry
  const cx = 100;
  const cy = 90;
  const radius = 70;
  const startAngle = Math.PI;       // 180° (left)
  const endAngle = 0;               // 0° (right)
  const scoreAngle = startAngle - (score / 10) * Math.PI;

  // Arc path helper
  const arcPath = (start: number, end: number, r: number) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy - r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy - r * Math.sin(end);
    const largeArc = start - end > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle endpoint
  const needleX = cx + (radius - 8) * Math.cos(scoreAngle);
  const needleY = cy - (radius - 8) * Math.sin(scoreAngle);

  // Colour based on score
  const gaugeColour =
    score >= 9 ? '#ff1744' :
    score >= 7 ? '#ff5722' :
    score >= 5 ? '#ff9800' :
    score >= 3 ? '#ffc107' :
    '#4caf50';

  const trendArrow = trend === 'rising' ? '▲' : trend === 'falling' ? '▼' : '—';
  const trendColour = trend === 'rising' ? '#ff1744' : trend === 'falling' ? '#4caf50' : '#9e9e9e';

  return (
    <div className="hud-panel h-full flex flex-col overflow-hidden">
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">🎚️ THREAT LEVEL</span>
        <span
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
          style={{
            color: gaugeColour,
            background: `${gaugeColour}15`,
            border: `1px solid ${gaugeColour}40`,
          }}
        >
          {label}
        </span>
      </div>

      {/* Gauge section — fixed, never scrolls */}
      <div className="flex-shrink-0 p-2">
        {/* SVG Gauge */}
        <svg viewBox="0 0 200 110" className="w-full" style={{ maxHeight: '120px' }}>
          {/* Background arc (dark) */}
          <path
            d={arcPath(startAngle, endAngle, radius)}
            fill="none"
            stroke="#1e2a3a"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Coloured arc (filled to score) */}
          <path
            d={arcPath(startAngle, scoreAngle, radius)}
            fill="none"
            stroke={gaugeColour}
            strokeWidth="12"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${gaugeColour}60)`,
              transition: 'all 1s ease-out',
            }}
          />

          {/* Tick marks */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => {
            const angle = startAngle - (tick / 10) * Math.PI;
            const innerR = radius - 18;
            const outerR = radius - 14;
            const x1t = cx + innerR * Math.cos(angle);
            const y1t = cy - innerR * Math.sin(angle);
            const x2t = cx + outerR * Math.cos(angle);
            const y2t = cy - outerR * Math.sin(angle);
            return (
              <line
                key={tick}
                x1={x1t} y1={y1t} x2={x2t} y2={y2t}
                stroke="#2a4a6b"
                strokeWidth="1"
              />
            );
          })}

          {/* Needle */}
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke={gaugeColour}
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${gaugeColour}80)`,
              transition: 'all 1s ease-out',
            }}
          />

          {/* Centre dot */}
          <circle cx={cx} cy={cy} r="4" fill={gaugeColour} opacity="0.8" />

          {/* Score text */}
          <text
            x={cx} y={cy + 20}
            textAnchor="middle"
            fill={gaugeColour}
            fontSize="22"
            fontWeight="700"
            fontFamily="'Orbitron', monospace"
            style={{ filter: `drop-shadow(0 0 8px ${gaugeColour}60)` }}
          >
            {score.toFixed(1)}
          </text>

          {/* Scale labels */}
          <text x="22" y={cy + 8} fill="#4a4a4a" fontSize="8" fontFamily="'JetBrains Mono', monospace">0</text>
          <text x="170" y={cy + 8} fill="#4a4a4a" fontSize="8" fontFamily="'JetBrains Mono', monospace">10</text>
        </svg>

        {/* DEFCON Label */}
        <div className="text-center mt-1 mb-2">
          <div className="text-[9px] font-mono text-gray-500">
            DEFCON {defconLevel} — {defcon.name}
          </div>
          <div className="text-[8px] font-mono text-gray-600 mt-0.5">
            {defcon.description}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-[9px] font-mono" style={{ color: trendColour }}>
              {trendArrow}
            </span>
            <span className="text-[8px] font-mono text-gray-500">
              {trend === 'rising' ? 'Increasing' : trend === 'falling' ? 'Decreasing' : 'Stable'}
            </span>
          </div>
        </div>
      </div>

      {/* Component Breakdown — scrollable */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="border-t border-cyber-border pt-2 space-y-1">
          <ComponentRow label="Zero-Days" value={components.activeZeroDays} max={3} colour="#ff1744" />
          <ComponentRow label="Unpatched CVEs" value={components.criticalCVEsUnpatched} max={10} colour="#ff5722" />
          <ComponentRow label="APT Campaigns" value={components.activeAPTCampaigns} max={5} colour="#ff6d00" />
          <ComponentRow label="Ransomware (24h)" value={components.ransomwareIncidents24h} max={10} colour="#ff9800" />
          <ComponentRow label="Velocity Spikes" value={components.velocitySpikes} max={5} colour="#ffc107" />
          <ComponentRow label="Signals" value={components.signalConvergences} max={3} colour="#00e5ff" />
        </div>
      </div>
    </div>
  );
}

function ComponentRow({ label, value, max, colour }: {
  label: string; value: number; max: number; colour: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] font-mono text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-cyber-card rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: colour }}
        />
      </div>
      <span className="text-[9px] font-mono text-gray-400 w-4 text-right">{value}</span>
    </div>
  );
}
