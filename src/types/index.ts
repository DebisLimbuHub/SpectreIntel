// ===== PODCAST TYPES =====

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  durationMs: number;
  thumbnailUrl: string;
  externalUrl: string;
}

// ===== THREAT INTELLIGENCE TYPES =====

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ThreatTrend = 'rising' | 'stable' | 'falling';

export interface ThreatFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  source: string;
  sourceTier: 1 | 2 | 3 | 4;
  sourceType: 'gov' | 'press' | 'vendor' | 'community' | 'osint';
  category: string;
  severity: ThreatSeverity;
  publishedAt: Date;
  fetchedAt: Date;
  cves?: string[];
  aptGroups?: string[];
  sectors?: string[];
  countries?: string[];
}

export interface ThreatCluster {
  id: string;
  primary: ThreatFeedItem;
  related: ThreatFeedItem[];
  sourceCount: number;
  velocity: VelocityData;
  severity: ThreatSeverity;
  isNew: boolean;
  seenAt?: Date;
}

// ===== SIGNAL TYPES =====

export type CyberSignalType =
  | 'convergence'
  | 'triangulation'
  | 'velocity_spike'
  | 'zero_day_signal'
  | 'stealth_campaign'
  | 'apt_surge'
  | 'patch_gap'
  | 'infra_cascade'
  | 'ransomware_wave'
  | 'exploit_chain';

export interface CyberSignal {
  id: string;
  type: CyberSignalType;
  confidence: number;
  severity: ThreatSeverity;
  title: string;
  description: string;
  sources: string[];
  relatedCVEs?: string[];
  relatedAPTs?: string[];
  timestamp: Date;
  expiresAt: Date;
}

// ===== CVE TYPES =====

export interface CVEEntry {
  id: string;               // CVE-2026-XXXX
  description: string;
  cvssScore: number;
  cvssVector: string;
  severity: ThreatSeverity;
  vendor: string;
  product: string;
  publishedDate: Date;
  lastModifiedDate: Date;
  isKEV: boolean;           // In CISA Known Exploited Vulns
  isExploitedInWild: boolean;
  patchAvailable: boolean;
  references: string[];
}

// ===== APT GROUP TYPES =====

export interface APTGroup {
  id: string;
  name: string;
  aliases: string[];
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  sponsor: string;
  targetSectors: string[];
  targetCountries: string[];
  techniques: string[];
  mitreId: string;
  activeSince: string;
  lastActivity?: Date;
  description: string;
}

// ===== MAP TYPES =====

export interface MapLayer {
  id: string;
  name: string;
  group: 'threats' | 'infrastructure' | 'network' | 'intelligence';
  icon: string;
  enabled: boolean;
  loading: boolean;
  lastFetch?: Date;
  itemCount: number;
  refreshInterval: number;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity?: ThreatSeverity;
  title: string;
  subtitle?: string;
  details?: Record<string, unknown>;
  layerId: string;
}

export interface AttackArc {
  id: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  severity: ThreatSeverity;
  label: string;
  aptGroup?: string;
}

// ===== INFRASTRUCTURE TYPES =====

export interface SectorRisk {
  sector: string;
  icon: string;
  riskLevel: number;        // 0-100
  activeThreats: number;
  recentIncidents: number;
  topAPT: string | null;
  trend: ThreatTrend;
}

export interface CriticalInfrastructure {
  id: string;
  name: string;
  type: 'energy' | 'water' | 'transport' | 'telecom' | 'healthcare' | 'financial' | 'government';
  lat: number;
  lng: number;
  country: string;
  operator?: string;
  riskLevel: ThreatSeverity;
}

// ===== NETWORK TYPES =====

export interface InternetOutage {
  id: string;
  country: string;
  region?: string;
  lat: number;
  lng: number;
  severity: ThreatSeverity;
  startTime: Date;
  endTime?: Date;
  affectedASN?: string;
  source: 'cloudflare' | 'ioda';
}

export interface BGPAnomaly {
  id: string;
  type: 'hijack' | 'leak' | 'outage';
  prefix: string;
  asn: string;
  originAS: string;
  detectedAt: Date;
  severity: ThreatSeverity;
  lat?: number;
  lng?: number;
}

export interface SubseaCable {
  id: string;
  name: string;
  landingPoints: { lat: number; lng: number; country: string }[];
  length: number;
  capacityTbps?: number;
  rfsDate?: string;
  owners: string[];
}

// ===== RANSOMWARE TYPES =====

export interface RansomwareGroup {
  name: string;
  aliases: string[];
  victimCount24h: number;
  victimCountTotal: number;
  trend: ThreatTrend;
  lastActivity: Date;
}

export interface RansomwareVictim {
  id: string;
  name: string;
  sector: string;
  country: string;
  group: string;
  publishedAt: Date;
  dataSize?: string;
  link?: string;
}

// ===== BOTNET TYPES =====

export interface BotnetC2 {
  id: string;
  ip: string;
  port: number;
  malwareFamily: string;
  lat: number;
  lng: number;
  country: string;
  firstSeen: Date;
  lastOnline: Date;
  status: 'online' | 'offline';
}

// ===== MARKET TYPES =====

export interface CyberStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
}

export type LiveChannelProvider =
  | 'youtube-video'
  | 'youtube-playlist'
  | 'youtube-user-uploads'
  | 'direct-iframe'
  | 'hls';

export interface LiveChannelSource {
  provider: LiveChannelProvider;
  videoId?: string;
  playlistId?: string;
  uploadsUser?: string;
  embedUrl?: string;
  streamUrl?: string;
  websiteUrl?: string;
  priority: number;
  label?: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  region: string;
  category: 'general' | 'finance' | 'geopolitics' | 'business';
  description?: string;
  sources: LiveChannelSource[];
  tags?: string[];
}

// ===== VELOCITY & ANALYSIS =====

export interface VelocityData {
  sourcesPerHour: number;
  trend: ThreatTrend;
  level: 'normal' | 'elevated' | 'spike';
}

export interface BaselineData {
  topic: string;
  mean7d: number;
  mean30d: number;
  stdDev: number;
  zScore: number;
  deviationLevel: 'spike' | 'elevated' | 'normal' | 'quiet';
}

// ===== THREAT LEVEL =====

export interface ThreatLevel {
  score: number;             // 0.0 - 10.0
  label: string;             // CRITICAL, HIGH, ELEVATED, GUARDED, LOW
  defconLevel: 1 | 2 | 3 | 4 | 5;
  trend: ThreatTrend;
  components: {
    activeZeroDays: number;
    criticalCVEsUnpatched: number;
    activeAPTCampaigns: number;
    ransomwareIncidents24h: number;
    infrastructureOutages: number;
    bgpAnomalies: number;
    velocitySpikes: number;
    signalConvergences: number;
  };
  updatedAt: Date;
}

// ===== ATTACK ORIGIN =====

export interface AttackOrigin {
  country: string;
  countryCode: string;
  flag: string;
  attackCount24h: number;
  topAPTs: string[];
  targetSectors: string[];
  trend: ThreatTrend;
}

// ===== ALERT TICKER =====

export interface AlertTickerItem {
  id: string;
  text: string;
  severity: ThreatSeverity;
  icon: string;
  timestamp: Date;
  source: string;
  link?: string;
}

// ===== CIRCUIT BREAKER =====

export interface CircuitBreakerState {
  service: string;
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure?: Date;
  cooldownUntil?: Date;
  lastSuccess?: Date;
}

// ===== MONITOR (Custom Keyword Alerts) =====

export interface CustomMonitor {
  id: string;
  keywords: string[];
  colour: string;
  matchCount: number;
  lastMatch?: Date;
  createdAt: Date;
  enabled: boolean;
}

// ===== SNAPSHOT =====

export interface DashboardSnapshot {
  id: string;
  timestamp: Date;
  threatLevel: ThreatLevel;
  signalCount: number;
  clusterCount: number;
  cveCount: number;
  outageCount: number;
  sectorRisks: SectorRisk[];
}
