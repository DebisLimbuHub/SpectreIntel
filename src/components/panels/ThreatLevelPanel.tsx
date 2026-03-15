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
      <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '380px', flexShrink: 0 }}>
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

  // Colour based on score — used for header badge, DEFCON label, trend arrow
  const gaugeColour =
    score >= 7 ? '#FF0000' :
    score >= 5 ? '#FF6600' :
    score >= 3 ? '#FFDD00' :
    '#32CD32';

  const trendArrow = trend === 'rising' ? '▲' : trend === 'falling' ? '▼' : '—';
  const trendColour = trend === 'rising' ? '#E00000' : trend === 'falling' ? '#4A6B3F' : '#8A8F98';

  return (
    <div className="hud-panel flex flex-col overflow-hidden" style={{ height: '380px', flexShrink: 0 }}>
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
          {/* Background arc (dark track) */}
          <path
            d={arcPath(startAngle, endAngle, radius)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Gradient arc — 50 segments interpolating green → white → red */}
          {Array.from({ length: 50 }, (_, i) => {
            const segStart = startAngle - (i / 50) * Math.PI;
            const segEnd = startAngle - ((i + 1) / 50) * Math.PI;
            const progress = i / 50;

            if (progress > score / 10) return null;

            // Interpolate colour: green → yellow → red
            let r, g, b;
            if (progress < 0.45) {
              const t = progress / 0.45;
              r = Math.round(50 + t * 205);   // 50 → 255
              g = Math.round(205 + t * 50);   // 205 → 255
              b = Math.round(50 - t * 50);    // 50 → 0
            } else if (progress < 0.55) {
              r = 255;
              g = 255;
              b = 0;
            } else {
              const t = (progress - 0.55) / 0.45;
              r = 255;
              g = Math.round(255 - t * 255);  // 255 → 0
              b = 0;
            }

            const segColour = `rgb(${r}, ${g}, ${b})`;

            return (
              <path
                key={i}
                d={arcPath(segStart, segEnd, radius)}
                fill="none"
                stroke={segColour}
                strokeWidth="12"
                strokeLinecap="butt"
                style={{
                  filter: progress > 0.7 ? `drop-shadow(0 0 4px ${segColour})` : 'none',
                  transition: 'all 0.5s ease-out',
                }}
              />
            );
          })}

          {/* End cap dot at needle tip */}
          <circle
            cx={cx + radius * Math.cos(scoreAngle)}
            cy={cy - radius * Math.sin(scoreAngle)}
            r="6"
            fill={score >= 7 ? '#FF0000' : score >= 4 ? '#FFDD00' : '#32CD32'}
            style={{
              filter: `drop-shadow(0 0 6px ${score >= 7 ? 'rgba(255,0,0,0.6)' : score >= 4 ? 'rgba(255,220,0,0.5)' : 'rgba(50,205,50,0.6)'})`,
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
            const tp = tick / 10;
            const tickColour = tp < 0.4
              ? 'rgba(50, 205, 50, 0.4)'
              : tp < 0.6
              ? 'rgba(255, 220, 0, 0.4)'
              : 'rgba(255, 0, 0, 0.4)';
            return (
              <line
                key={tick}
                x1={x1t} y1={y1t} x2={x2t} y2={y2t}
                stroke={tickColour}
                strokeWidth="1"
              />
            );
          })}

          {/* Needle */}
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))',
              transition: 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />

          {/* Centre dot */}
          <circle cx={cx} cy={cy} r="4" fill="#FFFFFF" opacity="0.8"
            style={{ filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))' }}
          />

          {/* Score text */}
          <text
            x={cx} y={cy + 20}
            textAnchor="middle"
            fill={score >= 7 ? '#FF0000' : score >= 4 ? '#FFDD00' : '#32CD32'}
            fontSize="22"
            fontWeight="700"
            fontFamily="'Orbitron', monospace"
            style={{
              filter: `drop-shadow(0 0 8px ${score >= 7 ? 'rgba(255,0,0,0.5)' : score >= 4 ? 'rgba(255,220,0,0.4)' : 'rgba(50,205,50,0.5)'})`,
              transition: 'fill 1s ease-out',
            }}
          >
            {score.toFixed(1)}
          </text>

          {/* Scale labels */}
          <text x="22" y={cy + 8} fill="#32CD32" fontSize="8" fontFamily="'JetBrains Mono', monospace" opacity="0.6">0</text>
          <text x="170" y={cy + 8} fill="#FF0000" fontSize="8" fontFamily="'JetBrains Mono', monospace" opacity="0.6">10</text>
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
          <ComponentRow label="Zero-Days" value={components.activeZeroDays} max={3} colour="#E00000" />
          <ComponentRow label="Unpatched CVEs" value={components.criticalCVEsUnpatched} max={10} colour="#E01515" />
          <ComponentRow label="APT Campaigns" value={components.activeAPTCampaigns} max={5} colour="#D43A1A" />
          <ComponentRow label="Ransomware (24h)" value={components.ransomwareIncidents24h} max={10} colour="#D43A1A" />
          <ComponentRow label="Velocity Spikes" value={components.velocitySpikes} max={5} colour="#C46A2A" />
          <ComponentRow label="Signals" value={components.signalConvergences} max={3} colour="#E01515" />
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
