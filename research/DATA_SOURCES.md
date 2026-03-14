# Cyber Monitor — Data Sources & API Reference

## RSS Feeds (Categorised by Source Tier)

### Tier 1: Government & Authority
```json
[
  { "name": "CISA Advisories", "url": "https://www.cisa.gov/cybersecurity-advisories/all.xml", "category": "gov", "tier": 1 },
  { "name": "CISA ICS Advisories", "url": "https://www.cisa.gov/cybersecurity-advisories/ics.xml", "category": "gov", "tier": 1 },
  { "name": "NCSC UK", "url": "https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml", "category": "gov", "tier": 1 },
  { "name": "ENISA", "url": "https://www.enisa.europa.eu/rss.xml", "category": "gov", "tier": 1 },
  { "name": "US-CERT", "url": "https://www.us-cert.gov/ncas/current-activity.xml", "category": "gov", "tier": 1 },
  { "name": "CERT-EU", "url": "https://cert.europa.eu/publications/security-advisories/rss", "category": "gov", "tier": 1 },
  { "name": "NVD CVE Feed", "url": "https://nvd.nist.gov/feeds/xml/cve/misc/nvd-rss.xml", "category": "gov", "tier": 1 },
  { "name": "FBI IC3", "url": "https://www.ic3.gov/RSS", "category": "gov", "tier": 1 }
]
```

### Tier 2: Major Cyber Press
```json
[
  { "name": "KrebsOnSecurity", "url": "https://krebsonsecurity.com/feed/", "category": "press", "tier": 2 },
  { "name": "BleepingComputer", "url": "https://www.bleepingcomputer.com/feed/", "category": "press", "tier": 2 },
  { "name": "The Record", "url": "https://therecord.media/feed", "category": "press", "tier": 2 },
  { "name": "SecurityWeek", "url": "https://www.securityweek.com/feed", "category": "press", "tier": 2 },
  { "name": "Dark Reading", "url": "https://www.darkreading.com/rss.xml", "category": "press", "tier": 2 },
  { "name": "The Hacker News", "url": "https://feeds.feedburner.com/TheHackersNews", "category": "press", "tier": 2 },
  { "name": "Schneier on Security", "url": "https://www.schneier.com/feed/atom/", "category": "press", "tier": 2 },
  { "name": "SANS ISC", "url": "https://isc.sans.edu/rssfeed.xml", "category": "press", "tier": 2 },
  { "name": "SC Magazine", "url": "https://www.scmagazine.com/feed", "category": "press", "tier": 2 },
  { "name": "Infosecurity Magazine", "url": "https://www.infosecurity-magazine.com/rss/news/", "category": "press", "tier": 2 }
]
```

### Tier 3: Vendor Threat Intel
```json
[
  { "name": "CrowdStrike", "url": "https://www.crowdstrike.com/blog/feed", "category": "vendor", "tier": 3 },
  { "name": "Mandiant", "url": "https://www.mandiant.com/resources/blog/rss.xml", "category": "vendor", "tier": 3 },
  { "name": "SentinelOne", "url": "https://www.sentinelone.com/blog/feed/", "category": "vendor", "tier": 3 },
  { "name": "Unit 42", "url": "https://unit42.paloaltonetworks.com/feed/", "category": "vendor", "tier": 3 },
  { "name": "Cisco Talos", "url": "https://blog.talosintelligence.com/feeds/posts/default", "category": "vendor", "tier": 3 },
  { "name": "Microsoft MSRC", "url": "https://msrc.microsoft.com/blog/feed", "category": "vendor", "tier": 3 },
  { "name": "Google TAG", "url": "https://blog.google/threat-analysis-group/rss/", "category": "vendor", "tier": 3 },
  { "name": "Recorded Future", "url": "https://www.recordedfuture.com/feed", "category": "vendor", "tier": 3 },
  { "name": "Sophos News", "url": "https://news.sophos.com/en-us/feed/", "category": "vendor", "tier": 3 },
  { "name": "ESET Research", "url": "https://www.welivesecurity.com/feed/", "category": "vendor", "tier": 3 },
  { "name": "Kaspersky SecureList", "url": "https://securelist.com/feed/", "category": "vendor", "tier": 3 },
  { "name": "Check Point Research", "url": "https://research.checkpoint.com/feed/", "category": "vendor", "tier": 3 },
  { "name": "Trend Micro", "url": "https://www.trendmicro.com/en_us/research.html/rss.xml", "category": "vendor", "tier": 3 },
  { "name": "Proofpoint", "url": "https://www.proofpoint.com/us/blog.xml", "category": "vendor", "tier": 3 }
]
```

### Tier 4: Community & OSINT
```json
[
  { "name": "Hacker News", "url": "https://news.ycombinator.com/rss", "category": "community", "tier": 4 },
  { "name": "r/netsec", "url": "https://www.reddit.com/r/netsec/.rss", "category": "community", "tier": 4 },
  { "name": "r/cybersecurity", "url": "https://www.reddit.com/r/cybersecurity/.rss", "category": "community", "tier": 4 },
  { "name": "Bellingcat", "url": "https://www.bellingcat.com/feed/", "category": "osint", "tier": 4 },
  { "name": "OSINT Curious", "url": "https://osintcurio.us/feed/", "category": "osint", "tier": 4 }
]
```

---

## API Endpoints

### Threat Intelligence APIs
| API | Endpoint | Auth | Rate Limit | Data |
|-----|----------|------|------------|------|
| NVD | api.nvd.nist.gov/rest/json/cves/2.0 | API key (free) | 50 req/30s | CVEs |
| CISA KEV | cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json | None | Static JSON | Known exploited vulns |
| AlienVault OTX | otx.alienvault.com/api/v1/ | API key (free) | Varies | Threat pulses, IoCs |
| Abuse.ch URLhaus | urlhaus-api.abuse.ch/v1/ | None | Reasonable | Malicious URLs |
| Abuse.ch MalwareBazaar | mb-api.abuse.ch/api/v1/ | None | Reasonable | Malware samples |
| Abuse.ch FeodoTracker | feodotracker.abuse.ch/downloads/ | None | Static CSVs | Botnet C2 servers |
| GreyNoise | api.greynoise.io/v3/ | API key (free tier) | 500/day free | Internet scan data |
| Shodan | api.shodan.io/ | API key (free tier) | Limited free | Device enumeration |

### Infrastructure APIs
| API | Endpoint | Auth | Data |
|-----|----------|------|------|
| Cloudflare Radar | api.cloudflare.com/client/v4/radar/ | API token (free) | Outages, trends |
| IODA | api.ioda.inetintel.cc.gatech.edu/v2/ | None | Internet outages |
| BGPStream | bgpstream.crosswork.cisco.com/ | None | BGP events |
| RIPE RIS | stat.ripe.net/data/ | None | Routing data |

### MITRE ATT&CK (Static Data)
- Groups: https://attack.mitre.org/groups/
- Techniques: https://attack.mitre.org/techniques/
- STIX/TAXII: https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json

---

## APT Group Data (for Map Markers)

### Major APT Groups with Attribution
```json
[
  { "id": "apt28", "name": "APT28 (Fancy Bear)", "country": "Russia", "lat": 55.7558, "lng": 37.6173, "sponsor": "GRU Unit 26165", "targets": ["government", "military", "energy"], "mitre": "G0007" },
  { "id": "apt29", "name": "APT29 (Cozy Bear)", "country": "Russia", "lat": 55.7558, "lng": 37.6173, "sponsor": "SVR", "targets": ["government", "think-tanks", "healthcare"], "mitre": "G0016" },
  { "id": "sandworm", "name": "Sandworm", "country": "Russia", "lat": 55.7558, "lng": 37.6173, "sponsor": "GRU Unit 74455", "targets": ["energy", "government", "media"], "mitre": "G0034" },
  { "id": "apt41", "name": "APT41 (Winnti)", "country": "China", "lat": 39.9042, "lng": 116.4074, "sponsor": "MSS / PLA", "targets": ["gaming", "healthcare", "telecom"], "mitre": "G0096" },
  { "id": "apt10", "name": "APT10 (Stone Panda)", "country": "China", "lat": 39.9042, "lng": 116.4074, "sponsor": "MSS Tianjin", "targets": ["MSPs", "government", "defence"], "mitre": "G0045" },
  { "id": "apt1", "name": "APT1 (Comment Crew)", "country": "China", "lat": 31.2304, "lng": 121.4737, "sponsor": "PLA Unit 61398", "targets": ["defence", "aerospace", "energy"], "mitre": "G0006" },
  { "id": "lazarus", "name": "Lazarus Group", "country": "North Korea", "lat": 39.0392, "lng": 125.7625, "sponsor": "RGB", "targets": ["finance", "crypto", "defence"], "mitre": "G0032" },
  { "id": "kimsuky", "name": "Kimsuky", "country": "North Korea", "lat": 39.0392, "lng": 125.7625, "sponsor": "RGB", "targets": ["think-tanks", "nuclear", "government"], "mitre": "G0094" },
  { "id": "apt33", "name": "APT33 (Elfin)", "country": "Iran", "lat": 35.6892, "lng": 51.3890, "sponsor": "IRGC", "targets": ["aviation", "energy", "petrochemical"], "mitre": "G0064" },
  { "id": "apt34", "name": "APT34 (OilRig)", "country": "Iran", "lat": 35.6892, "lng": 51.3890, "sponsor": "MOIS", "targets": ["government", "financial", "telecom"], "mitre": "G0049" },
  { "id": "apt35", "name": "APT35 (Charming Kitten)", "country": "Iran", "lat": 35.6892, "lng": 51.3890, "sponsor": "IRGC", "targets": ["academia", "media", "government"], "mitre": "G0059" },
  { "id": "turla", "name": "Turla (Snake)", "country": "Russia", "lat": 55.7558, "lng": 37.6173, "sponsor": "FSB Center 16", "targets": ["government", "military", "research"], "mitre": "G0010" },
  { "id": "muddywater", "name": "MuddyWater", "country": "Iran", "lat": 35.6892, "lng": 51.3890, "sponsor": "MOIS", "targets": ["telecom", "government", "oil-gas"], "mitre": "G0069" },
  { "id": "volt_typhoon", "name": "Volt Typhoon", "country": "China", "lat": 39.9042, "lng": 116.4074, "sponsor": "PLA", "targets": ["critical-infrastructure", "telecom", "government"], "mitre": "G1017" },
  { "id": "salt_typhoon", "name": "Salt Typhoon", "country": "China", "lat": 39.9042, "lng": 116.4074, "sponsor": "MSS", "targets": ["telecom", "ISPs"], "mitre": "G1045" }
]
```

---

## Critical Infrastructure Data (for Map Markers)

### Infrastructure Sectors (UK/Global Focus)
- **Energy**: Power stations, grid operators, renewable farms
- **Water**: Treatment plants, reservoirs, distribution networks
- **Transport**: Rail networks, airports, ports, traffic management
- **Telecom**: Internet exchanges, data centres, mobile networks
- **Healthcare**: NHS trusts, hospital networks, research facilities
- **Financial**: Stock exchanges, clearing houses, payment networks
- **Government**: GCHQ, MOD, Whitehall, devolved administrations

---

## Cybersecurity Stock Tickers
```json
{
  "endpoint": [
    { "symbol": "CRWD", "name": "CrowdStrike" },
    { "symbol": "PANW", "name": "Palo Alto Networks" },
    { "symbol": "FTNT", "name": "Fortinet" },
    { "symbol": "ZS", "name": "Zscaler" },
    { "symbol": "S", "name": "SentinelOne" },
    { "symbol": "CYBR", "name": "CyberArk" }
  ],
  "vulnerability_mgmt": [
    { "symbol": "QLYS", "name": "Qualys" },
    { "symbol": "TENB", "name": "Tenable" },
    { "symbol": "RPD", "name": "Rapid7" }
  ],
  "identity_web": [
    { "symbol": "OKTA", "name": "Okta" },
    { "symbol": "NET", "name": "Cloudflare" },
    { "symbol": "VRNS", "name": "Varonis" }
  ]
}
```
