# Cyber Monitor — Critical Infrastructure OSINT Dashboard

Real-time cybersecurity intelligence dashboard for monitoring global cyber threats, APT campaigns, vulnerabilities, and critical infrastructure security.

Inspired by [World Monitor](https://worldmonitor.app) by Elie Habib — adapted for cybersecurity operations.

## Features

### Interactive Threat Map
- **APT Group Markers** — 15+ state-sponsored threat actors with MITRE ATT&CK data
- **Attack Vector Arcs** — Animated lines showing attack origin → target
- **Critical Infrastructure** — Energy, water, transport, telecom facilities
- **Internet Outages** — Cloudflare Radar + IODA data
- **BGP Anomalies** — Route hijack detection
- **Botnet C2 Servers** — Abuse.ch FeodoTracker
- **Undersea Cables** — TeleGeography data

### Threat Intelligence Feed
- **40+ RSS feeds** from CISA, NCSC, KrebsOnSecurity, BleepingComputer, vendor blogs
- **Jaccard clustering** of related stories
- **Velocity analysis** — detect trending threats
- **4-tier source ranking** (Government → Major Press → Vendor → Community)

### Signal Detection Engine
- **Convergence** — Multiple feeds confirm same threat
- **Triangulation** — Government + vendor + researcher alignment
- **Velocity Spike** — Threat mention rate acceleration
- **APT Surge** — Coordinated campaign indicators
- **Patch Gap** — Critical CVE without vendor fix

### Panels
- **CVE Vulnerability Feed** — NVD + CISA KEV with severity scoring
- **Ransomware Tracker** — Active groups and recent victims
- **Threat Level Gauge** — Composite 0-10 score
- **Infrastructure Risk** — Per-sector risk levels
- **Attack Origins** — Country-level attribution
- **Cyber Stock Ticker** — CRWD, PANW, FTNT, ZS, S
- **Alert Ticker** — Scrolling real-time alerts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Map | Leaflet.js with CartoDB dark tiles |
| Charts | Recharts |
| State | Zustand |
| Styling | Tailwind CSS |
| Workers | Web Workers for clustering |
| Storage | IndexedDB for snapshots |
| Backend | Node.js + Express (local proxy) |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Data Sources

All data comes from free, open APIs and RSS feeds. No paid subscriptions required for core functionality.

## License

MIT

## Acknowledgments

- [World Monitor](https://worldmonitor.app) by Elie Habib — architecture inspiration
- [MITRE ATT&CK](https://attack.mitre.org) — threat framework
- [CISA](https://cisa.gov) — vulnerability and alert data
- [Abuse.ch](https://abuse.ch) — malware and botnet tracking
