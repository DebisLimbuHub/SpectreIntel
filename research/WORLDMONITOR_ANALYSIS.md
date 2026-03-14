# World Monitor — Complete Analysis & Cybersecurity Adaptation Blueprint

## Date: 14 March 2026
## Analyst: Claude AI (for Cyber Security Consultant)

---

## 1. EXECUTIVE SUMMARY

World Monitor (worldmonitor.app) by Elie Habib is an open-source real-time global intelligence dashboard that has grown to 2M+ users across 190+ countries. It aggregates 435+ curated RSS feeds, 45+ map layers, 100+ live data streams, and AI-powered analysis into a unified situational awareness interface.

**Our Goal**: Adapt this architecture into a **Cybersecurity OSINT Dashboard** — a "Critical Infrastructure Cyber Monitor" focused on cyber threats, APT tracking, vulnerability intelligence, and infrastructure security monitoring.

---

## 2. WORLDMONITOR TECHNICAL ARCHITECTURE

### 2.1 Tech Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | TypeScript 5.x | Type safety across 50+ source files |
| Build | Vite | Fast HMR, optimised production builds |
| Map (3D) | globe.gl | WebGL 3D globe rendering |
| Map (2D) | deck.gl | WebGL flat map with layers |
| Map (Original) | D3.js + TopoJSON | SVG map rendering, zoom/pan |
| Concurrency | Web Workers | Off-main-thread clustering and correlation |
| Networking | WebSocket + REST | Real-time streams + HTTP APIs |
| Storage | IndexedDB | Snapshots, baselines (megabytes of state) |
| Preferences | LocalStorage | User settings, monitors, panel order |
| Desktop | Tauri 2 | Native macOS, Windows, Linux app |
| Deployment | Vercel Edge | 60+ serverless proxy functions |
| AI | Ollama (local) | AI-powered intelligence synthesis |

### 2.2 Project Structure
```
src/
├── App.ts                    # Main application orchestrator
├── main.ts                   # Entry point
├── components/               # UI rendering (Map, Panels, Modals, Search)
├── config/                   # Static data (feeds, geo, pipelines, bases, airports)
├── services/                 # Data fetching & business logic
│   ├── clustering.ts         # Jaccard similarity news clustering
│   ├── correlation.ts        # Signal detection engine
│   ├── velocity.ts           # Velocity & sentiment analysis
│   ├── related-assets.ts     # Infrastructure near news events
│   ├── activity-tracker.ts   # New item detection & highlighting
│   ├── analysis-worker.ts    # Web Worker manager
│   └── storage.ts            # IndexedDB snapshots & baselines
├── workers/
│   └── analysis.worker.ts    # Off-thread clustering & correlation
├── utils/
│   ├── circuit-breaker.ts    # Fault tolerance pattern
│   ├── sanitize.ts           # XSS prevention
│   └── urlState.ts           # Shareable link encoding
├── styles/
└── types/
api/                          # Vercel Edge serverless proxies (60+)
```

### 2.3 Key Design Patterns

**No External UI Frameworks**: Pure DOM manipulation — no React/Vue/Angular. ~200KB gzipped.

**Circuit Breaker Pattern**: Each external API wrapped in fault-tolerant circuit breaker with 5-min cooldown and cached fallback.

**Virtual Scrolling**: Fixed-height (VirtualList) and variable-height (WindowedList) for 100+ item lists.

**Web Workers**: CPU-intensive operations (Jaccard clustering O(n²), correlation detection) run off main thread.

**Conditional Data Loading**: Only fetches data for enabled layers, closing WebSockets for disabled layers.

**Stale-While-Revalidate**: Old data displays while fetches complete.

---

## 3. WORLDMONITOR DATA LAYERS (Mapped to Cyber Equivalents)

### 3.1 Original WorldMonitor Layers → Cyber Adaptation

| WM Layer | WM Data Source | **Cyber Equivalent** | **Cyber Data Source** |
|----------|---------------|---------------------|----------------------|
| Conflicts | ACLED, UCDP | **Active Cyber Campaigns** | MITRE ATT&CK, AlienVault OTX |
| Hotspots | News keyword correlation | **Threat Hotspots** | GreyNoise, Shodan trends |
| Sanctions | Static data | **Sanctioned Entities** | OFAC SDN, UK HMT |
| Protests | ACLED + GDELT | **Hacktivism Activity** | DDoS-Guard, Telegram OSINT |
| Military Bases | 220+ installations | **SOC/CERT Locations** | FIRST.org directory |
| Nuclear Facilities | IAEA data | **Critical Infrastructure** | CISA ICS-CERT, ENISA |
| Undersea Cables | 55 cable routes | **Undersea Cables** (keep) | TeleGeography |
| Pipelines | 88 pipelines | **SCADA/ICS Targets** | ICS-CERT advisories |
| Internet Outages | Cloudflare Radar | **Internet Outages** (keep) | Cloudflare Radar, IODA |
| AI Datacenters | 111 clusters | **Data Centre Targets** | Cloud infrastructure map |
| Ships (AIS) | AISStream | **Dark Web Marketplaces** | Tor exit node map |
| Earthquakes | USGS | **Vulnerability Disclosures** | NVD, CVE.org |
| Weather Alerts | NWS | **Cyber Alerts** | CISA alerts, NCSC |
| Stocks/Markets | Finnhub, Yahoo | **Cyber Stock Tickers** | CrowdStrike, Palo Alto, etc. |
| Prediction Markets | Polymarket | **Threat Predictions** | Recorded Future, custom |
| News Feeds | 435+ RSS | **Cyber News Feeds** | KrebsOnSecurity, BleepingComputer, The Record |
| Pentagon Pizza | Foot traffic data | **DEFCON Cyber Level** | Composite threat score |
| APT Markers | MITRE attribution | **APT Tracking** (keep) | MITRE ATT&CK groups |

### 3.2 NEW Cyber-Specific Layers (Not in WorldMonitor)

| New Layer | Description | Data Source |
|-----------|-------------|-------------|
| **Ransomware Tracker** | Active ransomware campaigns, victim lists | Ransomwatch, DarkFeed |
| **CVE Heatmap** | Vulnerability severity by product/vendor | NVD API, CVE.org |
| **Botnet C2 Map** | Known command & control server locations | Abuse.ch, FeodoTracker |
| **DDoS Attack Map** | Real-time DDoS visualisation | DigitalAttackMap concept |
| **Phishing Campaigns** | Active phishing infrastructure | PhishTank, OpenPhish |
| **Data Breach Feed** | Recent breach disclosures | HaveIBeenPwned, DataBreaches.net |
| **Malware Families** | Trending malware by family | MalwareBazaar, VirusTotal |
| **DNS Anomalies** | Unusual DNS resolution patterns | Passive DNS, DNSDB |
| **BGP Hijack Alerts** | Route hijacking detection | BGPStream, RIPE RIS |
| **Tor Exit Nodes** | Tor network geography | Tor Project, ExoneraTor |
| **Exploit Activity** | Active exploitation in-the-wild | CISA KEV catalogue |
| **Sector Risk Gauge** | Risk by infrastructure sector | Composite scoring |

---

## 4. WORLDMONITOR SIGNAL INTELLIGENCE → CYBER SIGNALS

### 4.1 Original Signal Types
| Signal | Trigger | Cyber Adaptation |
|--------|---------|-----------------|
| Convergence | 3+ sources report same story in 30 min | **Multi-Feed Alert**: Same CVE/threat across 3+ feeds |
| Triangulation | Wire + Gov + Intel sources align | **Cross-Domain Confirm**: CISA + vendor + researcher align |
| Velocity Spike | Topic doubles with 6+ sources/hr | **Exploit Trending**: CVE mention rate accelerating |
| Prediction Leading | Market moves 5%+ with low coverage | **Zero-Day Signal**: Unusual vendor patching with low disclosure |
| Silent Divergence | Market moves 2%+ with minimal news | **Stealth Campaign**: Infrastructure changes without advisory |

### 4.2 NEW Cyber Signal Types
| Signal | Trigger | Significance |
|--------|---------|-------------|
| **APT Surge** | Multiple APT indicators in same region/sector | Coordinated campaign likely |
| **Patch Gap Alert** | Critical CVE + no vendor patch after 72h | Exploitation window open |
| **Infrastructure Cascade** | Outage + nearby cable cut + BGP anomaly | Potential coordinated attack |
| **Ransomware Wave** | 3+ same-family attacks in 24h | Active campaign spreading |
| **Insider Signal** | Unusual data exfil patterns + employee activity | Insider threat indicator |

---

## 5. WORLDMONITOR ALGORITHMS → CYBER ALGORITHMS

### 5.1 News Clustering (Jaccard Similarity)
```
similarity(A, B) = |A ∩ B| / |A ∪ B|
```
- Tokenise headlines, lowercase, strip stop words
- ≥0.5 similarity → grouped
- Sort by source tier → most authoritative = primary

**Cyber Adaptation**: Same algorithm applied to:
- CVE descriptions (group related vulnerabilities)
- Threat reports (cluster by campaign/APT)
- Incident reports (correlate related breaches)

### 5.2 Velocity Analysis
- Sources per hour = article count / time span
- Levels: Normal (<3/hr), Elevated (3-6/hr), Spike (>6/hr)

**Cyber Adaptation**: Track CVE/threat mention velocity across feeds.

### 5.3 Sentiment Detection → Severity Scoring
Replace positive/negative sentiment with **threat severity scoring**:
- **CRITICAL**: ransomware, zero-day, APT, breach, exploit, RCE, supply-chain
- **HIGH**: vulnerability, DDoS, phishing, malware, backdoor
- **MEDIUM**: patch, update, advisory, disclosure
- **LOW**: research, proof-of-concept, awareness

### 5.4 Baseline Deviation (Z-Score)
```
Z-score = (current - mean) / stddev
```
- Spike: Z > 2.5 (rare increase)
- Elevated: Z > 1.5
- Normal: -2 < Z < 1.5
- Quiet: Z < -2

**Cyber Adaptation**: Track per-sector, per-APT, per-CVE-vendor baseline deviations.

---

## 6. SOURCE INTELLIGENCE TIERS (Cyber Version)

| Tier | Sources | Characteristics |
|------|---------|----------------|
| **Tier 1** | CISA, NCSC, MITRE, NVD, vendor security advisories | Government/authority — fastest, most reliable |
| **Tier 2** | KrebsOnSecurity, BleepingComputer, The Record, Mandiant | Major cyber press — high editorial standards |
| **Tier 3** | Recorded Future, CrowdStrike blog, SentinelOne, Unit42 | Vendor threat intel — deep expertise, potential bias |
| **Tier 4** | Reddit r/netsec, Twitter/X OSINT, Hacker News | Community — requires corroboration |

### Source Types for Triangulation
- **Gov**: CISA, NCSC, ENISA, CERT-EU, FBI IC3
- **Vendor**: Microsoft MSRC, Google TAG, CrowdStrike, Mandiant
- **Research**: Academic, independent researchers, bug bounty
- **Community**: Reddit, Twitter/X, Mastodon InfoSec
- **Wire**: BleepingComputer, The Record, SecurityWeek

---

## 7. CONCEPT ART ANALYSIS

The uploaded OSINT_Concept_Art.png shows a "Critical Infrastructure Cyber Monitor" with:

### Visual Elements Identified:
1. **Central World Map** — Dark theme with glowing attack vectors shown as arc lines between countries
2. **Infra Incidents (24h)** — Counter showing 247 incidents with flame icon and sparkline chart
3. **Active Threats (24h)** — List: Frolov Energy Grid Attack, BlackFalcon DDoS Campaign, OilRig APT Activity
4. **Attack Origins** — Country breakdown: Russia (127), China (76), Iran (24) with flags
5. **Threat Level Gauge** — Semicircular gauge reading 8.7/10 "CRITICAL" with "THREAT LEVEL: HIGH" header
6. **Infra Risk Panel** — Sector risk indicators: Energy (critical), Water (high), Transport (medium), Oil & Gas (elevated)
7. **Top Targets** — US Power Grid (APT28/Russia), German Water Utility (China Group), South Korean Railway (Lazarus Group)
8. **Latest Alerts Ticker** — Scrolling text with real-time alerts
9. **Map Icons** — Fire, lightning, lock, warning, water drop icons representing different threat types
10. **Attack Arc Lines** — Orange/red arc lines showing attack vectors from origin to target
11. **Background** — Industrial infrastructure (power plants, transmission lines) blended into the design

### Design Language:
- Dark background (#0a0e17 range)
- Red/orange for critical threats
- Cyan/blue for informational elements
- Glowing neon accents
- HUD-style borders and containers
- Monospaced/technical fonts

---

## 8. CYBER OSINT DATA SOURCES (Free/Open APIs)

### 8.1 Threat Intelligence Feeds
| Source | Type | Auth | URL |
|--------|------|------|-----|
| NVD (NIST) | CVE database | API key (free) | nvd.nist.gov/developers |
| CISA KEV | Known exploited vulns | None | cisa.gov/known-exploited-vulnerabilities |
| CISA Alerts | Security advisories | RSS | cisa.gov/news-events/cybersecurity-advisories |
| NCSC (UK) | Security advisories | RSS | ncsc.gov.uk/section/keep-up-to-date |
| AlienVault OTX | Threat pulses | API key (free) | otx.alienvault.com |
| Abuse.ch | Malware/botnet tracking | None | abuse.ch (URLhaus, MalwareBazaar, FeodoTracker) |
| PhishTank | Phishing URLs | API key (free) | phishtank.org |
| GreyNoise | Internet noise/scanning | API key (free tier) | greynoise.io |
| Shodan | Internet-connected devices | API key (free tier) | shodan.io |
| MITRE ATT&CK | Threat framework | None (STIX/JSON) | attack.mitre.org |

### 8.2 Infrastructure Monitoring
| Source | Type | Auth | URL |
|--------|------|------|-----|
| Cloudflare Radar | Internet outages | API key (free) | radar.cloudflare.com |
| IODA (CAIDA) | Internet outage detection | None | ioda.inetintel.cc.gatech.edu |
| BGPStream | BGP anomalies | None | bgpstream.com |
| TeleGeography | Submarine cables | None (static) | submarinecablemap.com |
| RIPE RIS | Routing data | None | ris.ripe.net |

### 8.3 News & Research Feeds (RSS)
| Feed | Category | URL |
|------|----------|-----|
| KrebsOnSecurity | Investigative | krebsonsecurity.com/feed |
| BleepingComputer | Breaking news | bleepingcomputer.com/feed |
| The Record | Cyber journalism | therecord.media/feed |
| SecurityWeek | Industry news | securityweek.com/feed |
| Dark Reading | Enterprise security | darkreading.com/rss |
| The Hacker News | Cyber news | thehackernews.com/feeds |
| Schneier on Security | Analysis | schneier.com/feed |
| SANS ISC | Handler diaries | isc.sans.edu/rssfeed.xml |
| Threatpost | Threat research | (archived but reference) |
| CrowdStrike blog | Vendor intel | crowdstrike.com/blog/feed |
| Mandiant blog | Vendor intel | mandiant.com/resources/blog/rss.xml |
| SentinelOne blog | Vendor intel | sentinelone.com/blog/feed |
| Unit 42 (Palo Alto) | Vendor intel | unit42.paloaltonetworks.com/feed |
| Microsoft MSRC | Vendor advisories | msrc.microsoft.com/blog/feed |
| Google TAG | Threat analysis | blog.google/threat-analysis-group/rss |
| Recorded Future | Threat intel | recordedfuture.com/feed |
| FIRST.org | CSIRT community | first.org/newsroom/rss |
| Cisco Talos | Threat research | blog.talosintelligence.com/feeds |

### 8.4 Cybersecurity Market Data
| Ticker | Company | Sector |
|--------|---------|--------|
| CRWD | CrowdStrike | Endpoint |
| PANW | Palo Alto Networks | Network/Cloud |
| FTNT | Fortinet | Network Security |
| ZS | Zscaler | Zero Trust |
| S | SentinelOne | Endpoint AI |
| CYBR | CyberArk | Identity |
| QLYS | Qualys | Vulnerability Mgmt |
| TENB | Tenable | Vulnerability Mgmt |
| RPD | Rapid7 | Detection & Response |
| NET | Cloudflare | Web Security |
| OKTA | Okta | Identity |
| VRNS | Varonis | Data Security |

---

## 9. RECOMMENDED ARCHITECTURE FOR CYBER MONITOR

### 9.1 Tech Stack (Adapted from WorldMonitor)
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **React + TypeScript** | Better ecosystem for dashboards, vs WM's vanilla DOM |
| Build | **Vite** | Keep — proven fast |
| Map | **Leaflet.js** or **deck.gl** | Leaflet = simpler, deck.gl = WebGL power |
| Charts | **Recharts** or **Chart.js** | React-native charting |
| State | **Zustand** | Lightweight state management |
| Styling | **Tailwind CSS** | Rapid dark-theme styling |
| Workers | **Web Workers** | Keep — essential for clustering |
| Storage | **IndexedDB** | Keep — snapshots and baselines |
| Backend | **Node.js + Express** | Local API proxy + aggregation |
| Deployment | **Localhost first** → Vercel/Docker later | Per your setup |

### 9.2 Panel Layout (Inspired by Concept Art)
```
┌──────────────────────────────────────────────────────────┐
│  HEADER: Cyber Monitor v1.0 | Threat Level Gauge | Time │
├────────────┬─────────────────────────────┬───────────────┤
│            │                             │               │
│  THREATS   │       WORLD MAP             │  INFRA RISK   │
│  PANEL     │   (Attack vectors,          │  PANEL        │
│            │    APT markers,             │  Energy/Water/ │
│  - Active  │    infrastructure,          │  Transport/    │
│  - APTs    │    outages)                 │  Oil & Gas     │
│  - Origins │                             │               │
│            │                             │  THREAT GAUGE │
├────────────┼─────────────────────────────┼───────────────┤
│  CVE FEED  │  LATEST ALERTS TICKER       │  CYBER STOCKS │
│            │                             │               │
├────────────┼──────────────┬──────────────┼───────────────┤
│  NEWS      │  RANSOMWARE  │  SIGNALS     │  MARKET DATA  │
│  PANEL     │  TRACKER     │  DETECTION   │  PANEL        │
└────────────┴──────────────┴──────────────┴───────────────┘
```

### 9.3 Map Layers for Cyber Monitor
1. **APT Attribution Markers** — Known threat group locations with MITRE data
2. **Attack Vector Arcs** — Animated lines showing attack origin → target
3. **Critical Infrastructure** — Power, water, transport, telecom facilities
4. **Undersea Cables** — TeleGeography data (same as WM)
5. **Internet Outages** — Cloudflare Radar + IODA
6. **BGP Anomalies** — Route hijack indicators
7. **Botnet C2 Servers** — Abuse.ch FeodoTracker locations
8. **Tor Exit Nodes** — Network geography
9. **Data Centre Locations** — Major cloud/hosting targets
10. **Ransomware Victim Pins** — Recent victims geolocated

---

## 10. IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)
- [ ] Project scaffolding (Vite + React + TypeScript + Tailwind)
- [ ] Dark theme with HUD-style design system
- [ ] Basic Leaflet/D3 world map with dark tiles
- [ ] News aggregation service with circuit breakers
- [ ] 15+ cyber RSS feeds integrated

### Phase 2: Core Layers (Week 3-4)
- [ ] CISA KEV feed integration
- [ ] NVD CVE feed with severity colouring
- [ ] Internet outage layer (Cloudflare Radar)
- [ ] APT marker layer (MITRE ATT&CK static data)
- [ ] Undersea cable layer
- [ ] Critical infrastructure markers

### Phase 3: Intelligence (Week 5-6)
- [ ] News clustering (Jaccard similarity)
- [ ] Velocity analysis
- [ ] Threat severity scoring
- [ ] Signal detection engine
- [ ] Baseline deviation (Z-score)

### Phase 4: Advanced (Week 7-8)
- [ ] Abuse.ch botnet tracker
- [ ] BGP anomaly detection
- [ ] Attack vector arc visualisation
- [ ] Cyber stock ticker
- [ ] Threat level gauge (composite score)
- [ ] Infra risk sector panel

### Phase 5: Polish (Week 9-10)
- [ ] Search modal (⌘K)
- [ ] Custom monitors (keyword alerts)
- [ ] Shareable URL state
- [ ] Activity tracking (NEW badges)
- [ ] Export (CSV/JSON)
- [ ] Performance optimisation

---

## 11. WORLD-MONITOR.COM vs WORLDMONITOR.APP

**Note**: These are TWO DIFFERENT sites.

- **worldmonitor.app** (koala73/worldmonitor GitHub) — The open-source project by Elie Habib. TypeScript, 37k+ GitHub stars, comprehensive dashboard.
- **world-monitor.com** — A separate site with Signal Chain, HOT chat, Stocks, TV, Markets, Cameras, DEFCON, Outbreaks panels. Different project, similar concept.

Both serve as reference architectures for our cybersecurity adaptation.

---

## 12. KEY TAKEAWAYS FOR CYBER MONITOR BUILD

1. **Information density over aesthetics** — Every pixel should convey signal
2. **Authority matters** — Tier-1 government/CERT sources first
3. **Correlation over accumulation** — Clustering, velocity, cross-source patterns
4. **Local-first** — No accounts required, all preferences stored locally
5. **Circuit breakers** — Every external API must have fault tolerance
6. **Virtual scrolling** — Essential for high-volume feeds
7. **Web Workers** — CPU-intensive analysis off main thread
8. **Conditional loading** — Only fetch data for enabled layers
9. **Dark theme** — Minimise eye strain for extended monitoring
10. **Shareable state** — URL-encoded view configurations
