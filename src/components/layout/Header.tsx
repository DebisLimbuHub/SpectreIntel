import { useCyberStore } from '@/store';
import { SignalBadge } from '@/components/panels/SignalPanel';

export function Header() {
  const { threatLevel, setSearchOpen } = useCyberStore();

  return (
    <header className="h-10 bg-cyber-panel border-b border-cyber-border flex items-center px-3 gap-4 flex-shrink-0">
      {/* Logo & Title */}
      <div className="flex items-center gap-2">
        <span className="text-accent-cyan text-lg">◉</span>
        <h1 className="font-display text-sm font-semibold tracking-wider text-gray-200">
          CYBER MONITOR
        </h1>
        <span className="text-[9px] font-mono text-gray-600 bg-cyber-card px-1.5 py-0.5 rounded">
          v{__APP_VERSION__}
        </span>
      </div>

      {/* Threat Level Badge */}
      <div className="flex items-center gap-2">
        <ThreatLevelBadge level={threatLevel} />
      </div>

      {/* Signals Badge */}
      <SignalBadge />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search Trigger */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-1 rounded-sm bg-cyber-card border border-cyber-border hover:border-cyber-border-active transition-colors"
      >
        <span className="text-gray-500 text-xs">🔍</span>
        <span className="text-gray-500 text-[11px] font-mono">Search...</span>
        <kbd className="text-[9px] font-mono text-gray-600 bg-cyber-bg px-1 py-0.5 rounded border border-cyber-border ml-2">
          ⌘K
        </kbd>
      </button>

      {/* Status Indicators */}
      <div className="flex items-center gap-3">
        <StatusDot label="FEEDS" active />
        <StatusDot label="APIs" active />
        <Clock />
      </div>
    </header>
  );
}

function ThreatLevelBadge({ level }: { level: ReturnType<typeof useCyberStore>['threatLevel'] }) {
  if (!level) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-cyber-card rounded-sm border border-cyber-border">
        <span className="text-[10px] font-mono text-gray-500">THREAT LEVEL</span>
        <span className="text-[10px] font-mono text-gray-600">LOADING...</span>
      </div>
    );
  }

  const colourMap: Record<string, string> = {
    CRITICAL: 'text-threat-critical bg-threat-critical/10 border-threat-critical/30',
    HIGH: 'text-threat-high bg-threat-high/10 border-threat-high/30',
    ELEVATED: 'text-threat-medium bg-threat-medium/10 border-threat-medium/30',
    GUARDED: 'text-threat-low bg-threat-low/10 border-threat-low/30',
    LOW: 'text-threat-safe bg-threat-safe/10 border-threat-safe/30',
  };

  const classes = colourMap[level.label] || colourMap['LOW'];

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-sm border ${classes}`}>
      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
        THREAT: {level.label}
      </span>
      <span className="text-[11px] font-mono font-bold">{level.score.toFixed(1)}</span>
    </div>
  );
}

function StatusDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? 'bg-threat-safe' : 'bg-threat-critical animate-pulse'
        }`}
      />
      <span className="text-[9px] font-mono text-gray-500">{label}</span>
    </div>
  );
}

function Clock() {
  // Simple static clock — will be made reactive
  const now = new Date();
  const utc = now.toISOString().slice(11, 19);
  return (
    <span className="text-[10px] font-mono text-gray-500" title="UTC time">
      {utc}Z
    </span>
  );
}

// Declare the global version constant from Vite config
declare const __APP_VERSION__: string;
