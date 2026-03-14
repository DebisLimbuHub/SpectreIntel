/**
 * Cyber Monitor RSS Feed Configuration
 * 40+ feeds organised by source tier (adapted from WorldMonitor's 435+ feeds).
 *
 * Source Tiers:
 *   Tier 1 — Government & Authority (fastest, most reliable)
 *   Tier 2 — Major Cyber Press (high editorial standards)
 *   Tier 3 — Vendor Threat Intel (deep expertise, potential bias)
 *   Tier 4 — Community & OSINT (requires corroboration)
 */

export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  category: 'gov' | 'press' | 'vendor' | 'community' | 'osint';
  tier: 1 | 2 | 3 | 4;
  enabled: boolean;
  refreshInterval: number; // ms
}

export const FEEDS: FeedConfig[] = [
  // ===== TIER 1: GOVERNMENT & AUTHORITY =====
  { id: 'cisa-advisories', name: 'CISA Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', category: 'gov', tier: 1, enabled: true, refreshInterval: 300_000 },
  { id: 'cisa-ics', name: 'CISA ICS Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/ics.xml', category: 'gov', tier: 1, enabled: true, refreshInterval: 300_000 },
  { id: 'ncsc-uk', name: 'NCSC UK', url: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml', category: 'gov', tier: 1, enabled: true, refreshInterval: 600_000 },
  { id: 'cert-eu', name: 'CERT-EU', url: 'https://cert.europa.eu/publications/security-advisories/rss', category: 'gov', tier: 1, enabled: true, refreshInterval: 600_000 },

  // ===== TIER 2: MAJOR CYBER PRESS =====
  { id: 'krebs', name: 'KrebsOnSecurity', url: 'https://krebsonsecurity.com/feed/', category: 'press', tier: 2, enabled: true, refreshInterval: 600_000 },
  { id: 'bleeping', name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'press', tier: 2, enabled: true, refreshInterval: 300_000 },
  { id: 'therecord', name: 'The Record', url: 'https://therecord.media/feed', category: 'press', tier: 2, enabled: true, refreshInterval: 300_000 },
  { id: 'secweek', name: 'SecurityWeek', url: 'https://www.securityweek.com/feed', category: 'press', tier: 2, enabled: true, refreshInterval: 600_000 },
  { id: 'darkreading', name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', category: 'press', tier: 2, enabled: true, refreshInterval: 600_000 },
  { id: 'hackernews-cyber', name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: 'press', tier: 2, enabled: true, refreshInterval: 300_000 },
  { id: 'schneier', name: 'Schneier on Security', url: 'https://www.schneier.com/feed/atom/', category: 'press', tier: 2, enabled: true, refreshInterval: 1_800_000 },
  { id: 'sans-isc', name: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed.xml', category: 'press', tier: 2, enabled: true, refreshInterval: 600_000 },
  { id: 'infosec-mag', name: 'Infosecurity Magazine', url: 'https://www.infosecurity-magazine.com/rss/news/', category: 'press', tier: 2, enabled: true, refreshInterval: 600_000 },

  // ===== TIER 3: VENDOR THREAT INTEL =====
  { id: 'crowdstrike', name: 'CrowdStrike', url: 'https://www.crowdstrike.com/blog/feed', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'mandiant', name: 'Mandiant', url: 'https://www.mandiant.com/resources/blog/rss.xml', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'sentinelone', name: 'SentinelOne', url: 'https://www.sentinelone.com/blog/feed/', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'unit42', name: 'Unit 42', url: 'https://unit42.paloaltonetworks.com/feed/', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'talos', name: 'Cisco Talos', url: 'https://blog.talosintelligence.com/feeds/posts/default', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'msrc', name: 'Microsoft MSRC', url: 'https://msrc.microsoft.com/blog/feed', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'sophos', name: 'Sophos News', url: 'https://news.sophos.com/en-us/feed/', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'eset', name: 'ESET WeLiveSecurity', url: 'https://www.welivesecurity.com/feed/', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'securelist', name: 'Kaspersky SecureList', url: 'https://securelist.com/feed/', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'checkpoint', name: 'Check Point Research', url: 'https://research.checkpoint.com/feed/', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'proofpoint', name: 'Proofpoint', url: 'https://www.proofpoint.com/us/blog.xml', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },
  { id: 'recorded-future', name: 'Recorded Future', url: 'https://www.recordedfuture.com/feed', category: 'vendor', tier: 3, enabled: true, refreshInterval: 1_800_000 },

  // ===== TIER 4: COMMUNITY & OSINT =====
  { id: 'hn', name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'community', tier: 4, enabled: false, refreshInterval: 600_000 },
  { id: 'reddit-netsec', name: 'r/netsec', url: 'https://www.reddit.com/r/netsec/.rss', category: 'community', tier: 4, enabled: false, refreshInterval: 600_000 },
  { id: 'reddit-cyber', name: 'r/cybersecurity', url: 'https://www.reddit.com/r/cybersecurity/.rss', category: 'community', tier: 4, enabled: false, refreshInterval: 600_000 },
  { id: 'bellingcat', name: 'Bellingcat', url: 'https://www.bellingcat.com/feed/', category: 'osint', tier: 4, enabled: true, refreshInterval: 1_800_000 },
];

// Source type mapping for triangulation detection
export const SOURCE_TYPES = {
  gov: ['cisa-advisories', 'cisa-ics', 'ncsc-uk', 'cert-eu'],
  vendor: ['crowdstrike', 'mandiant', 'sentinelone', 'unit42', 'talos', 'msrc', 'sophos', 'eset', 'securelist', 'checkpoint', 'proofpoint', 'recorded-future'],
  press: ['krebs', 'bleeping', 'therecord', 'secweek', 'darkreading', 'hackernews-cyber', 'schneier', 'sans-isc', 'infosec-mag'],
  community: ['hn', 'reddit-netsec', 'reddit-cyber', 'bellingcat'],
} as const;
