import { create } from 'zustand';
import type {
  ThreatLevel,
  ThreatCluster,
  CyberSignal,
  CVEEntry,
  SectorRisk,
  AttackOrigin,
  AlertTickerItem,
  MapLayer,
  CustomMonitor,
  RansomwareGroup,
  RansomwareVictim,
  InternetOutage,
  BotnetC2,
  CyberStock,
  CircuitBreakerState,
} from '@/types';

interface CyberMonitorState {
  // === THREAT LEVEL ===
  threatLevel: ThreatLevel | null;
  setThreatLevel: (level: ThreatLevel) => void;

  // === THREAT FEED ===
  clusters: ThreatCluster[];
  setClusters: (clusters: ThreatCluster[]) => void;

  // === SIGNALS ===
  signals: CyberSignal[];
  setSignals: (signals: CyberSignal[]) => void;
  addSignal: (signal: CyberSignal) => void;

  // === CVEs ===
  cves: CVEEntry[];
  setCVEs: (cves: CVEEntry[]) => void;

  // === SECTOR RISKS ===
  sectorRisks: SectorRisk[];
  setSectorRisks: (risks: SectorRisk[]) => void;

  // === ATTACK ORIGINS ===
  attackOrigins: AttackOrigin[];
  setAttackOrigins: (origins: AttackOrigin[]) => void;

  // === ALERT TICKER ===
  alerts: AlertTickerItem[];
  addAlert: (alert: AlertTickerItem) => void;
  setAlerts: (alerts: AlertTickerItem[]) => void;

  // === RANSOMWARE ===
  ransomwareGroups: RansomwareGroup[];
  ransomwareVictims: RansomwareVictim[];
  setRansomwareData: (groups: RansomwareGroup[], victims: RansomwareVictim[]) => void;

  // === NETWORK ===
  outages: InternetOutage[];
  setOutages: (outages: InternetOutage[]) => void;
  botnets: BotnetC2[];
  setBotnets: (botnets: BotnetC2[]) => void;

  // === MARKETS ===
  cyberStocks: CyberStock[];
  setCyberStocks: (stocks: CyberStock[]) => void;

  // === MAP LAYERS ===
  layers: MapLayer[];
  toggleLayer: (layerId: string) => void;
  setLayerLoading: (layerId: string, loading: boolean) => void;

  // === CUSTOM MONITORS ===
  monitors: CustomMonitor[];
  addMonitor: (monitor: CustomMonitor) => void;
  removeMonitor: (id: string) => void;
  toggleMonitor: (id: string) => void;

  // === CIRCUIT BREAKERS ===
  circuitBreakers: CircuitBreakerState[];
  setCircuitBreakerState: (service: string, state: CircuitBreakerState) => void;

  // === UI STATE ===
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  selectedPanel: string | null;
  setSelectedPanel: (panel: string | null) => void;
  timeFilter: '1h' | '6h' | '24h' | '48h' | '7d';
  setTimeFilter: (filter: '1h' | '6h' | '24h' | '48h' | '7d') => void;
  mapView: { lat: number; lng: number; zoom: number };
  setMapView: (view: { lat: number; lng: number; zoom: number }) => void;
}

export const useCyberStore = create<CyberMonitorState>((set) => ({
  // Threat Level
  threatLevel: null,
  setThreatLevel: (level) => set({ threatLevel: level }),

  // Threat Feed
  clusters: [],
  setClusters: (clusters) => set({ clusters }),

  // Signals
  signals: [],
  setSignals: (signals) => set({ signals }),
  addSignal: (signal) => set((s) => ({ signals: [signal, ...s.signals].slice(0, 50) })),

  // CVEs
  cves: [],
  setCVEs: (cves) => set({ cves }),

  // Sector Risks
  sectorRisks: [
    { sector: 'Energy & Power', icon: '⚡', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
    { sector: 'Water & Utilities', icon: '💧', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
    { sector: 'Transport', icon: '🚆', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
    { sector: 'Oil & Gas', icon: '🛢️', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
    { sector: 'Telecommunications', icon: '📡', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
    { sector: 'Healthcare', icon: '🏥', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
    { sector: 'Financial Services', icon: '🏦', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
    { sector: 'Government & Defence', icon: '🏛️', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
  ],
  setSectorRisks: (risks) => set({ sectorRisks: risks }),

  // Attack Origins
  attackOrigins: [],
  setAttackOrigins: (origins) => set({ attackOrigins: origins }),

  // Alert Ticker
  alerts: [],
  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 100) })),
  setAlerts: (alerts) => set({ alerts }),

  // Ransomware
  ransomwareGroups: [],
  ransomwareVictims: [],
  setRansomwareData: (groups, victims) => set({ ransomwareGroups: groups, ransomwareVictims: victims }),

  // Network
  outages: [],
  setOutages: (outages) => set({ outages }),
  botnets: [],
  setBotnets: (botnets) => set({ botnets }),

  // Markets
  cyberStocks: [],
  setCyberStocks: (stocks) => set({ cyberStocks: stocks }),

  // Map Layers
  layers: [
    { id: 'apt-markers', name: 'APT Groups', group: 'threats', icon: '⚠', enabled: true, loading: false, itemCount: 0, refreshInterval: 3600000 },
    { id: 'active-campaigns', name: 'Active Campaigns', group: 'threats', icon: '🎯', enabled: true, loading: false, itemCount: 0, refreshInterval: 300000 },
    { id: 'ransomware', name: 'Ransomware Victims', group: 'threats', icon: '🔒', enabled: false, loading: false, itemCount: 0, refreshInterval: 600000 },
    { id: 'botnet-c2', name: 'Botnet C2 Servers', group: 'threats', icon: '🤖', enabled: false, loading: false, itemCount: 0, refreshInterval: 900000 },
    { id: 'critical-infra', name: 'Critical Infrastructure', group: 'infrastructure', icon: '🏗️', enabled: true, loading: false, itemCount: 0, refreshInterval: 86400000 },
    { id: 'undersea-cables', name: 'Undersea Cables', group: 'infrastructure', icon: '🌐', enabled: false, loading: false, itemCount: 0, refreshInterval: 86400000 },
    { id: 'data-centres', name: 'Data Centres', group: 'infrastructure', icon: '🖥️', enabled: false, loading: false, itemCount: 0, refreshInterval: 86400000 },
    { id: 'outages', name: 'Internet Outages', group: 'network', icon: '📡', enabled: true, loading: false, itemCount: 0, refreshInterval: 300000 },
    { id: 'bgp-anomalies', name: 'BGP Anomalies', group: 'network', icon: '🔀', enabled: false, loading: false, itemCount: 0, refreshInterval: 600000 },
    { id: 'tor-exits', name: 'Tor Exit Nodes', group: 'network', icon: '🧅', enabled: false, loading: false, itemCount: 0, refreshInterval: 3600000 },
    { id: 'cve-hotspots', name: 'CVE Activity', group: 'intelligence', icon: '🐛', enabled: true, loading: false, itemCount: 0, refreshInterval: 600000 },
    { id: 'phishing', name: 'Phishing Infra', group: 'intelligence', icon: '🎣', enabled: false, loading: false, itemCount: 0, refreshInterval: 900000 },
  ],
  toggleLayer: (layerId) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, enabled: !l.enabled } : l
      ),
    })),
  setLayerLoading: (layerId, loading) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, loading } : l
      ),
    })),

  // Custom Monitors
  monitors: [],
  addMonitor: (monitor) => set((s) => ({ monitors: [...s.monitors, monitor] })),
  removeMonitor: (id) => set((s) => ({ monitors: s.monitors.filter((m) => m.id !== id) })),
  toggleMonitor: (id) =>
    set((s) => ({
      monitors: s.monitors.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      ),
    })),

  // Circuit Breakers
  circuitBreakers: [],
  setCircuitBreakerState: (service, state) =>
    set((s) => ({
      circuitBreakers: [
        ...s.circuitBreakers.filter((cb) => cb.service !== service),
        state,
      ],
    })),

  // UI State
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  selectedPanel: null,
  setSelectedPanel: (panel) => set({ selectedPanel: panel }),
  timeFilter: '24h',
  setTimeFilter: (filter) => set({ timeFilter: filter }),
  mapView: { lat: 30, lng: 0, zoom: 2.5 },
  setMapView: (view) => set({ mapView: view }),
}));
