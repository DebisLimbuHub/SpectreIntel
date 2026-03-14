import { useEffect } from 'react';
import { useCyberStore } from './store';
import { Header } from './components/layout/Header';
import { AlertTicker } from './components/layout/AlertTicker';
import { ThreatMap } from './components/map/ThreatMap';
import { ThreatFeedPanel } from './components/panels/ThreatFeedPanel';
import { ActiveThreatsPanel } from './components/panels/ActiveThreatsPanel';
import { AttackOriginsPanel } from './components/panels/AttackOriginsPanel';
import { TopTargetsPanel } from './components/panels/TopTargetsPanel';
import { CVEFeedPanel } from './components/panels/CVEFeedPanel';
import { ThreatLevelPanel } from './components/panels/ThreatLevelPanel';
import { InfraRiskPanel } from './components/panels/InfraRiskPanel';
import { SignalPanel } from './components/panels/SignalPanel';
import { RansomwareTrackerPanel } from './components/panels/RansomwareTrackerPanel';
import { CyberStocksPanel } from './components/panels/CyberStocksPanel';
import { SearchModal } from './components/shared/SearchModal';
import { useDataOrchestrator } from './hooks/useDataOrchestrator';

/**
 * Project X — Cyber Monitor Main Application
 * Phase 5: Polish — constrained panel sizes, ticker fix, all panels visible.
 */

export default function App() {
  const { setSearchOpen } = useCyberStore();

  // Start data fetching, clustering, and correlation
  useDataOrchestrator();

  // Keyboard shortcut: ⌘K / Ctrl+K for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchOpen]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-cyber-bg">
      {/* Search Modal (⌘K) */}
      <SearchModal />

      {/* Header Bar */}
      <Header />

      {/* Main Dashboard Area */}
      <main className="flex-1 flex overflow-hidden">

        {/* ===== LEFT SIDEBAR ===== */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-1 p-1 overflow-y-auto">
          {/* Threat feed gets the most space but is capped */}
          <div className="min-h-[200px] max-h-[35vh] flex flex-col">
            <ThreatFeedPanel />
          </div>
          {/* Active threats — always visible */}
          <div className="min-h-[160px] max-h-[25vh] flex flex-col">
            <ActiveThreatsPanel />
          </div>
          {/* Attack origins — always visible */}
          <div className="min-h-[150px] max-h-[22vh] flex flex-col">
            <AttackOriginsPanel />
          </div>
          {/* Top targets */}
          <div className="min-h-[140px] max-h-[22vh] flex flex-col">
            <TopTargetsPanel />
          </div>
        </aside>

        {/* ===== CENTRE MAP ===== */}
        <section className="flex-1 relative">
          <ThreatMap />

          <div className="absolute top-2 right-2 z-[1000]">
            <LayerToggles />
          </div>

          <div className="absolute top-2 left-2 z-[1000]">
            <TimeFilter />
          </div>
        </section>

        {/* ===== RIGHT SIDEBAR ===== */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-1 p-1 overflow-y-auto">
          {/* Threat gauge — needs full height for the SVG arc */}
          <div className="min-h-[290px] max-h-[38vh] flex flex-col">
            <ThreatLevelPanel />
          </div>
          {/* Infra risk */}
          <div className="min-h-[160px] max-h-[25vh] flex flex-col">
            <InfraRiskPanel />
          </div>
          {/* CVE feed */}
          <div className="min-h-[200px] max-h-[30vh] flex flex-col">
            <CVEFeedPanel />
          </div>
          {/* Signals */}
          <div className="min-h-[120px] max-h-[22vh] flex flex-col">
            <SignalPanel />
          </div>
          {/* Ransomware tracker */}
          <div className="min-h-[130px] max-h-[22vh] flex flex-col">
            <RansomwareTrackerPanel />
          </div>
          {/* Cyber stocks */}
          <div className="min-h-[180px] max-h-[30vh] flex flex-col">
            <CyberStocksPanel />
          </div>
        </aside>

      </main>

      {/* Bottom Alert Ticker */}
      <AlertTicker />
    </div>
  );
}

// ===== MAP OVERLAY COMPONENTS =====

function LayerToggles() {
  const { layers, toggleLayer } = useCyberStore();
  const groups = ['threats', 'infrastructure', 'network', 'intelligence'] as const;

  return (
    <div className="hud-panel p-2 space-y-2 max-w-48">
      <span className="hud-panel-title text-[10px]">MAP LAYERS</span>
      {groups.map((group) => (
        <div key={group}>
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1">
            {group}
          </p>
          {layers
            .filter((l) => l.group === group)
            .map((layer) => (
              <label
                key={layer.id}
                className="flex items-center gap-1.5 text-[11px] font-mono cursor-pointer py-0.5 hover:text-accent-cyan transition-colors"
              >
                <input
                  type="checkbox"
                  checked={layer.enabled}
                  onChange={() => toggleLayer(layer.id)}
                  className="accent-accent-cyan w-3 h-3"
                />
                <span className={layer.enabled ? 'text-gray-300' : 'text-gray-600'}>
                  {layer.icon} {layer.name}
                </span>
                {layer.loading && (
                  <span className="text-accent-cyan text-[8px] animate-pulse">●</span>
                )}
              </label>
            ))}
        </div>
      ))}
    </div>
  );
}

function TimeFilter() {
  const { timeFilter, setTimeFilter } = useCyberStore();
  const filters = ['1h', '6h', '24h', '48h', '7d'] as const;

  return (
    <div className="hud-panel p-1.5 flex gap-1">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setTimeFilter(f)}
          className={`px-2 py-0.5 text-[10px] font-mono rounded-sm transition-all ${
            timeFilter === f
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
