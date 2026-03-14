# Cyber Monitor — Feature Mapping & Implementation Guide

## WorldMonitor Feature → Cyber Monitor Equivalent

### 1. INTERACTIVE GLOBAL MAP

**WorldMonitor**: D3.js + TopoJSON SVG map, deck.gl WebGL flat, globe.gl 3D globe
**Cyber Monitor**: Leaflet.js with dark tiles (simpler to start, upgrade to deck.gl later)

**Implementation Notes**:
- Use CartoDB Dark Matter tiles: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Custom SVG markers for each threat type
- Attack vector arcs using Leaflet.curve or D3 arc overlays
- Layer toggle system (same pattern as WM)
- Zoom presets: Global, Europe, MENA, Asia-Pacific, Americas

**Map Layers** (toggle-able):
```typescript
interface MapLayer {
  id: string;
  name: string;
  group: 'threats' | 'infrastructure' | 'network' | 'intelligence';
  icon: string;
  enabled: boolean;
  fetchFn: () => Promise<LayerData[]>;
  refreshInterval: number; // ms
}

const layers: MapLayer[] = [
  // THREATS GROUP
  { id: 'apt-markers', name: 'APT Groups', group: 'threats', refreshInterval: 3600000 },
  { id: 'active-campaigns', name: 'Active Campaigns', group: 'threats', refreshInterval: 300000 },
  { id: 'ransomware', name: 'Ransomware Victims', group: 'threats', refreshInterval: 600000 },
  { id: 'botnet-c2', name: 'Botnet C2 Servers', group: 'threats', refreshInterval: 900000 },
  { id: 'ddos-attacks', name: 'DDoS Activity', group: 'threats', refreshInterval: 300000 },
  
  // INFRASTRUCTURE GROUP
  { id: 'critical-infra', name: 'Critical Infrastructure', group: 'infrastructure', refreshInterval: 86400000 },
  { id: 'undersea-cables', name: 'Undersea Cables', group: 'infrastructure', refreshInterval: 86400000 },
  { id: 'data-centres', name: 'Data Centres', group: 'infrastructure', refreshInterval: 86400000 },
  { id: 'internet-exchanges', name: 'Internet Exchanges', group: 'infrastructure', refreshInterval: 86400000 },
  
  // NETWORK GROUP
  { id: 'outages', name: 'Internet Outages', group: 'network', refreshInterval: 300000 },
  { id: 'bgp-anomalies', name: 'BGP Anomalies', group: 'network', refreshInterval: 600000 },
  { id: 'tor-exits', name: 'Tor Exit Nodes', group: 'network', refreshInterval: 3600000 },
  
  // INTELLIGENCE GROUP
  { id: 'cve-hotspots', name: 'CVE Activity', group: 'intelligence', refreshInterval: 600000 },
  { id: 'phishing', name: 'Phishing Infrastructure', group: 'intelligence', refreshInterval: 900000 },
];
```

---

### 2. NEWS AGGREGATION → THREAT INTELLIGENCE FEED

**WorldMonitor**: 435+ RSS feeds, Jaccard clustering, velocity analysis, source tiers
**Cyber Monitor**: 40+ cyber RSS feeds, same clustering with threat-severity scoring

**Panel Design**:
```
┌─────────────────────────────────────┐
│ THREAT INTEL FEED          ↻ 2m ago │
│ ─────────────────────────────────── │
│ [CRITICAL] [CVE] [2 sources]       │
│ ● Critical RCE in Fortinet FortiOS │
│   CISA, BleepingComputer · 12m ago │
│   ▸ CVE-2026-XXXX · CVSS 9.8      │
│   ▸ Active exploitation detected   │
│                                     │
│ [HIGH] [RANSOMWARE] [3 sources]    │
│ ● LockBit 4.0 Claims UK Water Co  │
│   The Record, SecurityWeek · 45m   │
│   ▸ 2TB data allegedly exfiltrated │
│                                     │
│ [MEDIUM] [APT] [1 source]          │
│ ● Volt Typhoon Targets US Telecom  │
│   Mandiant · 2h ago                │
│   ▸ Living-off-the-land techniques │
└─────────────────────────────────────┘
```

**Clustering Algorithm** (adapted from WM):
```typescript
// Jaccard similarity on tokenised headlines
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

// Cyber-specific stop words to filter
const CYBER_STOP_WORDS = new Set([
  'security', 'cyber', 'attack', 'new', 'report', 'says',
  'update', 'latest', 'breaking', 'alert', 'warning'
]);

// Threat severity keywords
const SEVERITY_KEYWORDS = {
  critical: ['zero-day', 'rce', 'ransomware', 'breach', 'apt', 'supply-chain', 'critical', 'emergency'],
  high: ['vulnerability', 'exploit', 'ddos', 'malware', 'backdoor', 'phishing', 'cve'],
  medium: ['patch', 'advisory', 'update', 'disclosure', 'campaign'],
  low: ['research', 'poc', 'awareness', 'guide', 'report']
};
```

---

### 3. SIGNAL INTELLIGENCE → CYBER SIGNAL ENGINE

**WorldMonitor**: 5 signal types (Convergence, Triangulation, Velocity, Prediction, Divergence)
**Cyber Monitor**: Adapted + 5 new cyber-specific signals

```typescript
interface CyberSignal {
  id: string;
  type: CyberSignalType;
  confidence: number;      // 0-100
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  sources: string[];
  relatedCVEs?: string[];
  relatedAPTs?: string[];
  timestamp: Date;
}

type CyberSignalType =
  // Adapted from WM
  | 'convergence'          // 3+ feeds report same threat in 30min
  | 'triangulation'        // Gov + vendor + researcher confirm
  | 'velocity_spike'       // Threat mention rate doubling
  | 'zero_day_signal'      // Unusual patching with low disclosure
  | 'stealth_campaign'     // Infrastructure changes without advisory
  // New cyber signals
  | 'apt_surge'            // Multiple APT indicators in same sector
  | 'patch_gap'            // Critical CVE + no patch after 72h
  | 'infra_cascade'        // Outage + cable cut + BGP anomaly
  | 'ransomware_wave'      // 3+ same-family attacks in 24h
  | 'exploit_chain'        // Multiple related CVEs being chained
;
```

---

### 4. THREAT LEVEL GAUGE (replaces WM's generic severity)

**Concept Art Reference**: Semicircular gauge, 0-10 scale, "CRITICAL" at 8.7

**Composite Score Calculation**:
```typescript
interface ThreatLevelInputs {
  activeZeroDays: number;         // Weight: 25%
  criticalCVEsUnpatched: number;  // Weight: 20%
  activeAPTCampaigns: number;     // Weight: 15%
  ransomwareIncidents24h: number; // Weight: 15%
  infrastructureOutages: number;  // Weight: 10%
  bgpAnomalies: number;           // Weight: 5%
  velocitySpikes: number;         // Weight: 5%
  signalConvergences: number;     // Weight: 5%
}

function calculateThreatLevel(inputs: ThreatLevelInputs): number {
  const weighted =
    (Math.min(inputs.activeZeroDays / 3, 1) * 25) +
    (Math.min(inputs.criticalCVEsUnpatched / 10, 1) * 20) +
    (Math.min(inputs.activeAPTCampaigns / 5, 1) * 15) +
    (Math.min(inputs.ransomwareIncidents24h / 10, 1) * 15) +
    (Math.min(inputs.infrastructureOutages / 5, 1) * 10) +
    (Math.min(inputs.bgpAnomalies / 3, 1) * 5) +
    (Math.min(inputs.velocitySpikes / 5, 1) * 5) +
    (Math.min(inputs.signalConvergences / 3, 1) * 5);
  
  return Math.round(weighted) / 10; // 0.0 - 10.0
}

// Severity labels
function getThreatLabel(score: number): string {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 5.0) return 'ELEVATED';
  if (score >= 3.0) return 'GUARDED';
  return 'LOW';
}
```

---

### 5. INFRASTRUCTURE RISK PANEL (from Concept Art)

**Concept Art**: Energy, Water, Transport, Oil & Gas with severity bars

```typescript
interface SectorRisk {
  sector: string;
  icon: string;
  riskLevel: number;        // 0-100
  activeThreats: number;
  recentIncidents: number;
  topAPT: string | null;
  trend: 'rising' | 'stable' | 'falling';
}

const SECTORS: SectorRisk[] = [
  { sector: 'Energy & Power', icon: '⚡', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
  { sector: 'Water & Utilities', icon: '💧', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
  { sector: 'Transport', icon: '🚆', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
  { sector: 'Oil & Gas', icon: '🛢️', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
  { sector: 'Telecommunications', icon: '📡', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
  { sector: 'Healthcare', icon: '🏥', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
  { sector: 'Financial Services', icon: '🏦', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
  { sector: 'Government & Defence', icon: '🏛️', riskLevel: 0, activeThreats: 0, recentIncidents: 0, topAPT: null, trend: 'stable' },
];

// Risk calculated from:
// - CVEs affecting sector-specific vendors (ICS-CERT advisories)
// - Active APT campaigns targeting sector
// - Recent incidents reported in feeds
// - Infrastructure outage correlation
```

---

### 6. ATTACK ORIGINS PANEL (from Concept Art)

**Concept Art**: Russia 127, China 76, Iran 24 with country flags

```typescript
interface AttackOrigin {
  country: string;
  countryCode: string;    // ISO 3166-1
  flag: string;           // Emoji or SVG
  attackCount24h: number;
  topAPTs: string[];
  targetSectors: string[];
  trend: 'rising' | 'stable' | 'falling';
}

// Aggregated from:
// - APT campaign attribution (MITRE)
// - Threat intel feed country tags
// - GreyNoise scan origin data
// - Botnet C2 geolocation
```

---

### 7. TOP TARGETS PANEL (from Concept Art)

**Concept Art**: US Power Grid → APT28, German Water → China Group, SK Railway → Lazarus

```typescript
interface TopTarget {
  name: string;
  country: string;
  sector: string;
  threatActor: string;
  threatActorCountry: string;
  severity: 'critical' | 'high' | 'medium';
  lastActivity: Date;
  sourceCount: number;
}
```

---

### 8. LATEST ALERTS TICKER (from Concept Art)

**Concept Art**: Scrolling text bar at bottom with real-time alerts

```typescript
interface AlertTicker {
  id: string;
  text: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  icon: string;
  timestamp: Date;
  source: string;
  link?: string;
}

// Populated from:
// - CISA alerts (real-time)
// - NCSC advisories
// - Critical CVE disclosures (CVSS >= 9.0)
// - Confirmed ransomware attacks
// - Major data breaches
// - Infrastructure outages
```

---

### 9. CVE VULNERABILITY FEED (New — not in WM)

```
┌─────────────────────────────────────┐
│ VULNERABILITY FEED       ↻ just now │
│ ─────────────────────────────────── │
│ 🔴 CVE-2026-1234  CVSS 9.8  [KEV] │
│    Fortinet FortiOS RCE            │
│    Actively exploited · 2h ago      │
│                                     │
│ 🟠 CVE-2026-5678  CVSS 8.1        │
│    Microsoft Exchange SSRF         │
│    Patch available · 6h ago         │
│                                     │
│ 🟡 CVE-2026-9012  CVSS 7.5        │
│    Apache Struts Path Traversal    │
│    PoC published · 12h ago          │
└─────────────────────────────────────┘
```

**Data Flow**:
1. Poll NVD API every 10 min for new CVEs
2. Cross-reference with CISA KEV for "actively exploited" flag
3. Score severity: CVSS + exploitation status + affected product criticality
4. Cluster by vendor/product family
5. Track velocity (mentions across feeds)

---

### 10. RANSOMWARE TRACKER (New — not in WM)

```
┌─────────────────────────────────────┐
│ RANSOMWARE TRACKER       ↻ 15m ago │
│ ─────────────────────────────────── │
│ Active Groups (24h):                │
│ ▸ LockBit 4.0    ██████░░  12 hits │
│ ▸ BlackCat/ALPHV  ████░░░░   8 hits│
│ ▸ Play            ███░░░░░   5 hits│
│ ▸ Cl0p            ██░░░░░░   3 hits│
│                                     │
│ Recent Victims:                     │
│ 🔴 UK Water Authority  · LockBit   │
│ 🔴 US Hospital Group   · BlackCat  │
│ 🟠 German Manufacturer · Play      │
└─────────────────────────────────────┘
```

---

### 11. CYBER DEFCON LEVEL (replaces Pentagon Pizza Index)

**WorldMonitor**: Foot traffic near Pentagon = operational tempo
**Cyber Monitor**: Composite cyber threat readiness level

| Level | Threshold | Label | Meaning |
|-------|-----------|-------|---------|
| DEFCON 1 | ≥9.0 | MAXIMUM ALERT | Nation-state attack on critical infrastructure |
| DEFCON 2 | ≥7.0 | HIGH ALERT | Multiple zero-days + active exploitation |
| DEFCON 3 | ≥5.0 | ELEVATED | Significant campaign activity |
| DEFCON 4 | ≥3.0 | GUARDED | Above-normal threat levels |
| DEFCON 5 | <3.0 | NORMAL | Baseline cyber operations |

---

### 12. SEARCH MODAL (⌘K) — Adapted from WM

```typescript
interface SearchResult {
  type: 'cve' | 'apt' | 'news' | 'infrastructure' | 'indicator';
  title: string;
  subtitle: string;
  severity?: string;
  icon: string;
  action: () => void; // Navigate, zoom map, open panel
}

// Search across:
// - CVE database (by ID, vendor, keyword)
// - APT groups (by name, alias, country)
// - News articles (headline text)
// - Infrastructure (name, location)
// - IoCs (IP, domain, hash — if integrated)
```

---

### 13. CUSTOM MONITORS (Keyword Alerts) — Same as WM

```typescript
interface CyberMonitor {
  id: string;
  keywords: string[];   // e.g., ['fortinet', 'fortigate', 'cve-2026']
  colour: string;       // Unique colour assignment
  matchCount: number;
  lastMatch?: Date;
  createdAt: Date;
}

// Scans all incoming feeds for keyword matches
// Highlights matching items in all panels
// Persists to localStorage
```

---

### 14. DATA EXPORT — Same as WM

- CSV export of current dashboard state
- JSON export for programmatic use
- Screenshot/PDF export of current view
- API endpoint for integration with SIEM/SOAR

---

## Services Architecture

```
src/services/
├── feeds.ts              # RSS aggregation with circuit breakers
├── clustering.ts         # Jaccard similarity clustering
├── correlation.ts        # Cyber signal detection engine
├── velocity.ts           # Mention velocity & trend analysis
├── severity.ts           # Threat severity scoring
├── cve.ts                # NVD CVE fetching & processing
├── cisa.ts               # CISA KEV & alerts
├── abuse-ch.ts           # URLhaus, MalwareBazaar, FeodoTracker
├── outages.ts            # Cloudflare Radar + IODA
├── bgp.ts                # BGPStream anomaly detection
├── ransomware.ts         # Ransomwatch / DarkFeed integration
├── markets.ts            # Cyber stock tickers
├── threat-level.ts       # Composite threat score calculation
├── sector-risk.ts        # Infrastructure sector risk scoring
├── attack-origins.ts     # Country-level attack attribution
├── activity-tracker.ts   # New item detection & highlighting
├── storage.ts            # IndexedDB snapshots & baselines
├── circuit-breaker.ts    # Fault tolerance pattern
└── analysis-worker.ts    # Web Worker manager
```
