import { useEffect, useState } from 'react';
import { useCyberStore } from './store';
import { Header } from './components/layout/Header';
import { AlertTicker } from './components/layout/AlertTicker';
import { CybersecurityNews } from './components/panels/CybersecurityNews';
import { ThreatMap } from './components/map/ThreatMap';
import { ThreatFeedPanel } from './components/panels/ThreatFeedPanel';
import { ActiveThreatsPanel } from './components/panels/ActiveThreatsPanel';
import { AttackOriginsPanel } from './components/panels/AttackOriginsPanel';
import { CVEFeedPanel } from './components/panels/CVEFeedPanel';
import { ThreatLevelPanel } from './components/panels/ThreatLevelPanel';
import { InfraRiskPanel } from './components/panels/InfraRiskPanel';
import { SignalPanel } from './components/panels/SignalPanel';
import { RansomwareTrackerPanel } from './components/panels/RansomwareTrackerPanel';
import { CyberStocksPanel } from './components/panels/CyberStocksPanel';
import { LiveChannelsPanel } from './components/panels/LiveChannelsPanel';
import { SearchModal } from './components/shared/SearchModal';
import { useDataOrchestrator } from './hooks/useDataOrchestrator';

/**
 * Project X — Cyber Monitor Main Application
 * Phase 5: Polish — constrained panel sizes, ticker fix, all panels visible.
 */

type AppView = 'dashboard' | 'news';

export default function App() {
  const setSearchOpen = useCyberStore((state) => state.setSearchOpen);
  const [view, setView] = useState<AppView>('dashboard');

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
      {/* Global red hue overlay — gives everything a subtle red tint */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(224, 21, 21, 0.02) 0%, rgba(139, 10, 10, 0.04) 100%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Search Modal (⌘K) */}
      <SearchModal />

      {/* Header Bar */}
      <Header />

      {/* View toggle nav */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1 bg-cyber-panel border-b border-cyber-border">
        <button
          onClick={() => setView('dashboard')}
          className={`px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded-sm transition-colors ${
            view === 'dashboard'
              ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          🗺 Dashboard
        </button>
        <button
          onClick={() => setView('news')}
          className={`px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded-sm transition-colors ${
            view === 'news'
              ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          📡 Cyber Intel
        </button>
      </div>

      {view === 'dashboard' ? (
        <>
          {/* Main Dashboard Area */}
          <main className="flex-1 flex overflow-hidden">

            {/* ===== LEFT SIDEBAR — independently scrollable ===== */}
            <aside
              style={{
                width: '288px',
                flexShrink: 0,
                height: 'calc(100vh - 68px)',
                overflowY: 'scroll',
                overflowX: 'hidden',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <LiveChannelsPanel />
              <ThreatFeedPanel />
              <ActiveThreatsPanel />
              <AttackOriginsPanel />
            </aside>

            {/* ===== CENTRE MAP — fills remaining space, never scrolls ===== */}
            <section className="flex-1 relative overflow-hidden">
              <ThreatMap />

              <div className="absolute top-2 right-2 z-[1000]">
                <LayerToggles />
              </div>

              <div className="absolute top-2 left-2 z-[1000]">
                <TimeFilter />
              </div>
            </section>

            {/* ===== RIGHT SIDEBAR — independently scrollable ===== */}
            <aside
              style={{
                width: '288px',
                flexShrink: 0,
                height: 'calc(100vh - 68px)',
                overflowY: 'scroll',
                overflowX: 'hidden',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <ThreatLevelPanel />
              <InfraRiskPanel />
              <CVEFeedPanel />
              <SignalPanel />
              <RansomwareTrackerPanel />
              <CyberStocksPanel />
            </aside>

          </main>

          {/* Bottom Alert Ticker */}
          <AlertTicker />
        </>
      ) : (
        <div className="flex-1 overflow-auto">
          <CybersecurityNews />
        </div>
      )}
    </div>
  );
}

// ===== MAP OVERLAY COMPONENTS =====

function LayerToggles() {
  const layers = useCyberStore((state) => state.layers);
  const toggleLayer = useCyberStore((state) => state.toggleLayer);
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
  const timeFilter = useCyberStore((state) => state.timeFilter);
  const setTimeFilter = useCyberStore((state) => state.setTimeFilter);
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
