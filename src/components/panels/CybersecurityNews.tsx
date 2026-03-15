import { useState, useMemo, useEffect } from 'react';
import type { ThreatSeverity, PodcastEpisode } from '@/types';
import { sanitiseUrl, truncate } from '@/utils/sanitise';
import { useCyberStore } from '@/store';
import { LIVE_CHANNELS } from '@/config/liveChannels';
import { getChannelWebsiteUrl } from '@/utils/liveChannelEmbed';
import { useYoutubeLiveUrls } from '@/hooks/useYoutubeLiveUrls';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsAlert {
  id: string;
  title: string;
  description: string;
  severity: ThreatSeverity;
  category: string;
  source: string;
  publishedAt: string;
  link: string;
  cve?: string;
}

interface NewsChannel {
  id: string;
  name: string;
  description: string;
  updateLabel: string;
  categories: string[];
  headlines: string[];
  color: string;
}

interface Podcast {
  id: string;
  name: string;
  episodeTitle: string;
  date: string;
  duration: string;
  description: string;
  icon: string;
}

interface CyberPodcast {
  id: string;
  title: string;
  publisher: string;
  description: string;
  frequency: string;
  category: 'threat-intel' | 'news' | 'technical' | 'leadership' | 'offensive';
  spotifyUrl: string | null;
  spotifyEmbedUrl: string | null;
  artworkUrl: string | null;
  artworkFallbackUrl?: string;
  rssUrl?: string;
  featured: boolean;
}

interface TickerItem {
  label: string;
  text: string;
  severity: ThreatSeverity;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ALERTS: NewsAlert[] = [
  {
    id: 'a1',
    title: 'Critical Zero-Day Exploited in Fortinet FortiOS — Active Exploitation Confirmed',
    description: 'A critical zero-day vulnerability (CVSSv3: 9.8) in Fortinet FortiOS SSL-VPN is being actively exploited by nation-state threat actors. Unauthenticated RCE allows full network compromise. Patch immediately or disable SSL-VPN.',
    severity: 'critical',
    category: 'Zero-Day',
    source: 'CISA / Fortinet PSIRT',
    publishedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    link: 'https://www.cisa.gov',
    cve: 'CVE-2025-0211',
  },
  {
    id: 'a2',
    title: 'APT29 (Cozy Bear) Resumes Spear-Phishing Campaign Targeting EU Diplomatic Entities',
    description: 'Russian state-sponsored group APT29 has resumed targeted phishing operations against European foreign ministries and NATO-affiliated organizations. Custom WINELOADER malware variant deployed via compromised wine-tasting event invitations.',
    severity: 'high',
    category: 'APT',
    source: 'Mandiant Threat Intelligence',
    publishedAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    link: 'https://www.mandiant.com',
  },
  {
    id: 'a3',
    title: 'BlackBasta Ransomware Gang Claims Attack on Critical Infrastructure Operator',
    description: 'The BlackBasta ransomware group has claimed responsibility for an attack on a major European energy infrastructure operator, exfiltrating 500GB of operational data. Ransom demand reportedly exceeds $15M.',
    severity: 'critical',
    category: 'Ransomware',
    source: 'BleepingComputer',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    link: 'https://www.bleepingcomputer.com',
  },
  {
    id: 'a4',
    title: 'CVSS 9.1 Vulnerability in Ivanti Connect Secure — Patch Available',
    description: 'Ivanti has patched a critical authentication bypass vulnerability in Connect Secure VPN appliances. Exploitation requires no credentials and enables arbitrary code execution. Over 30,000 appliances internet-exposed.',
    severity: 'high',
    category: 'Vulnerability',
    source: 'Dark Reading',
    publishedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    link: 'https://www.darkreading.com',
    cve: 'CVE-2025-2299',
  },
  {
    id: 'a5',
    title: 'MedusaLocker Operators Shift to Healthcare Targets in Q1 2025',
    description: 'Threat intelligence analysts report a marked increase in MedusaLocker ransomware campaigns against hospital networks and healthcare providers. Average ransom demand has risen to $2.3M.',
    severity: 'high',
    category: 'Ransomware',
    source: 'Security Affairs',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    link: 'https://securityaffairs.com',
  },
  {
    id: 'a6',
    title: 'Phishing Campaign Impersonating Microsoft 365 Harvests Credentials at Scale',
    description: 'Large-scale AiTM (Adversary-in-the-Middle) phishing campaign bypasses MFA by intercepting session tokens. Over 10,000 corporate accounts compromised across financial and legal sectors.',
    severity: 'medium',
    category: 'Phishing',
    source: 'TheHackerNews',
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    link: 'https://thehackernews.com',
  },
  {
    id: 'a7',
    title: 'Lazarus Group Deploys New macOS Backdoor via Fake Job Offer PDFs',
    description: 'North Korean APT Lazarus Group is delivering a novel macOS backdoor targeting cryptocurrency and fintech employees through LinkedIn job offers. The malware establishes persistence via LaunchAgent.',
    severity: 'high',
    category: 'APT',
    source: 'Cisco Talos',
    publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    link: 'https://blog.talosintelligence.com',
  },
  {
    id: 'a8',
    title: 'SANS Internet Stormcast: Port 22 Scanning Spike — Credential Stuffing Wave',
    description: 'SANS Internet Storm Center reports a 340% increase in SSH port 22 scan attempts over the past 48 hours. Correlated with leaked credential database from recent data broker breach.',
    severity: 'medium',
    category: 'Threat Intelligence',
    source: 'SANS ISC',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    link: 'https://isc.sans.edu',
  },
];

const MOCK_CHANNELS: NewsChannel[] = [
  {
    id: 'sans',
    name: 'SANS Institute',
    description: 'Internet Storm Center daily threat briefings and handlers diary.',
    updateLabel: 'LIVE',
    categories: ['Threat Intel', 'Handlers Diary', 'Education'],
    headlines: [
      'Port 22 scanning spike — credential stuffing wave continues',
      'ISC Stormcast: New Golang malware targeting Linux servers',
      'SANS FOR508 updated — DFIR course now covers cloud forensics',
    ],
    color: '#E01515',
  },
  {
    id: 'krebs',
    name: 'KrebsOnSecurity',
    description: 'In-depth investigative journalism on cybercrime and security.',
    updateLabel: '1h ago',
    categories: ['Cybercrime', 'Investigation', 'Breaches'],
    headlines: [
      'Identity thieves bypass Experian security to access credit reports',
      'Feds charge man with stealing $65M via SIM swapping',
      'Fake browser updates push Lumma Stealer infostealer',
    ],
    color: '#D43A1A',
  },
  {
    id: 'darkreading',
    name: 'Dark Reading',
    description: 'Enterprise security news, analysis, and vulnerability coverage.',
    updateLabel: '23m ago',
    categories: ['Enterprise', 'Vulnerability', 'Analysis'],
    headlines: [
      'Ivanti patches critical auth bypass in Connect Secure VPN',
      'Why the CISO role is becoming impossible to fill',
      'AI-generated phishing attacks are 40% more effective',
    ],
    color: '#8B0A0A',
  },
  {
    id: 'secaffairs',
    name: 'Security Affairs',
    description: 'Global security intelligence, APT reports, and ICS/SCADA threats.',
    updateLabel: '42m ago',
    categories: ['APT', 'ICS/SCADA', 'Ransomware'],
    headlines: [
      'MedusaLocker shifts focus to healthcare providers in Q1 2025',
      'China-linked Salt Typhoon found in additional US telcos',
      'New ICS malware targets European water treatment facilities',
    ],
    color: '#E01515',
  },
  {
    id: 'bleeping',
    name: 'BleepingComputer',
    description: 'Breaking security news, ransomware tracker, and malware analysis.',
    updateLabel: '8m ago',
    categories: ['Ransomware', 'Malware', 'Breaking'],
    headlines: [
      'BlackBasta claims attack on critical infrastructure operator',
      'LockBit 4.0 builder leaked — new variants expected',
      'Windows SmartScreen bypass exploited as zero-day',
    ],
    color: '#E00000',
  },
  {
    id: 'thhn',
    name: 'TheHackerNews',
    description: 'Trusted source for cybersecurity news for the tech community.',
    updateLabel: '15m ago',
    categories: ['Vulnerabilities', 'Privacy', 'Cloud Security'],
    headlines: [
      'Microsoft 365 AiTM phishing bypasses MFA — 10K accounts hit',
      'Critical flaw in Apache Struts actively exploited in the wild',
      'GitHub Actions poisoning attack targets open-source CI/CD',
    ],
    color: '#8B0A0A',
  },
  {
    id: 'talos',
    name: 'Cisco Talos',
    description: "World-class threat intelligence from Cisco's research division.",
    updateLabel: '3h ago',
    categories: ['Malware', 'APT', 'Threat Research'],
    headlines: [
      'Lazarus Group deploys new macOS backdoor via fake job PDFs',
      'TinyTurla-NG: New Turla campaign targets European NGOs',
      'Talos discovers novel DNS-over-HTTPS C2 beaconing technique',
    ],
    color: '#4A6B3F',
  },
  {
    id: 'mandiant',
    name: 'Mandiant Intelligence',
    description: 'Google-backed threat intelligence, incident response, and APT tracking.',
    updateLabel: '5h ago',
    categories: ['APT', 'Nation-State', 'Incident Response'],
    headlines: [
      'APT29 resumes spear-phishing targeting EU diplomatic corps',
      'UNC4841 expands Barracuda ESG exploitation to new regions',
      'M-Trends 2025: Dwell time drops to 10 days — detection improving',
    ],
    color: '#D43A1A',
  },
];

const MOCK_PODCASTS: Podcast[] = [
  {
    id: 'dd',
    name: 'Darknet Diaries',
    episodeTitle: 'Ep 163: The Dark Caracal',
    date: 'Mar 11, 2025',
    duration: '1h 08m',
    description: 'Jack Rhysider investigates a nation-state mobile espionage campaign targeting journalists and activists across 21 countries.',
    icon: '🎙️',
  },
  {
    id: 'mm',
    name: 'Malware Monday',
    episodeTitle: 'Lumma Stealer: The New Default',
    date: 'Mar 10, 2025',
    duration: '42m',
    description: 'Malwarebytes researchers break down how Lumma Stealer became the most-deployed infostealer of 2025 via YouTube and fake CAPTCHA sites.',
    icon: '🦠',
  },
  {
    id: 'sn',
    name: 'Security Now',
    episodeTitle: 'Ep 1012: Post-Quantum TLS',
    date: 'Mar 12, 2025',
    duration: '1h 52m',
    description: 'Steve Gibson and Leo Laporte deep-dive into NIST\'s newly standardised post-quantum cryptography algorithms and what enterprises need to do now.',
    icon: '🔐',
  },
  {
    id: 'cw',
    name: 'The CyberWire',
    episodeTitle: 'Daily Briefing — Mar 13, 2025',
    date: 'Mar 13, 2025',
    duration: '21m',
    description: 'Dave Bittner\'s daily intel briefing covers BlackBasta infrastructure operations, EU NIS2 compliance deadlines, and the latest CISA KEV additions.',
    icon: '📻',
  },
  {
    id: 'cc',
    name: 'CISO Craft',
    episodeTitle: 'Building a Threat-Informed Defense',
    date: 'Mar 9, 2025',
    duration: '58m',
    description: 'CISO roundtable discussion on operationalising MITRE ATT&CK, measuring security ROI, and surviving board-level security conversations.',
    icon: '🛡️',
  },
];

const CYBER_PODCASTS: CyberPodcast[] = [
  {
    id: 'darknet-diaries',
    title: 'Darknet Diaries',
    publisher: 'Jack Rhysider',
    description: 'True stories from the dark side of the internet covering hacking, data breaches and cyber crime.',
    category: 'threat-intel',
    frequency: 'Bi-weekly',
    featured: true,
    spotifyUrl: 'https://open.spotify.com/show/4XPl3uEEL9hvqMkoZrzbx5',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/4XPl3uEEL9hvqMkoZrzbx5?utm_source=generator&theme=0',
    rssUrl: 'https://feeds.megaphone.fm/darknetdiaries',
    artworkUrl: '/podcast-artwork/darknet-diaries.jpg',
  },
  {
    id: 'cyberwire-daily',
    title: 'CyberWire Daily',
    publisher: 'N2K Networks',
    description: 'The daily cybersecurity news briefing trusted by security professionals worldwide.',
    category: 'news',
    frequency: 'Daily',
    featured: true,
    spotifyUrl: 'https://open.spotify.com/show/0CnYnxrAcfRjh0YSQINAwe',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/0CnYnxrAcfRjh0YSQINAwe?utm_source=generator&theme=0',
    rssUrl: 'https://feeds.megaphone.fm/the-cyberwire-daily',
    artworkUrl: '/podcast-artwork/cyberwire-daily.jpg',
  },
  {
    id: 'risky-business',
    title: 'Risky Business',
    publisher: 'Patrick Gray',
    description: 'Weekly information security news and in-depth commentary from industry leaders.',
    category: 'news',
    frequency: 'Weekly',
    featured: true,
    spotifyUrl: 'https://open.spotify.com/show/0BdExoUZqbGsBYjt6QZtEJ',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/0BdExoUZqbGsBYjt6QZtEJ?utm_source=generator&theme=0',
    rssUrl: 'https://risky.biz/feeds/risky-business/',
    artworkUrl: '/podcast-artwork/risky-business.png',
  },
  {
    id: 'smashing-security',
    title: 'Smashing Security',
    publisher: 'Graham Cluley & Carole Theriault',
    description: 'A helpful and hilarious take on the week in computer security and online privacy.',
    category: 'news',
    frequency: 'Weekly',
    featured: false,
    spotifyUrl: 'https://open.spotify.com/show/3J7pBxEu43nCnRTSXaan8S',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/3J7pBxEu43nCnRTSXaan8S?utm_source=generator&theme=0',
    rssUrl: 'https://feeds.acast.com/public/shows/smashing-security',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/c5/d7/a8/c5d7a894-f886-7dee-8814-18204dabad46/mza_16440597878419294581.jpeg/600x600bb.jpg',
  },
  {
    id: 'malicious-life',
    title: 'Malicious Life',
    publisher: 'Cybereason',
    description: 'The untold stories of the history of cybersecurity told by the people who were there.',
    category: 'threat-intel',
    frequency: 'Bi-weekly',
    featured: false,
    spotifyUrl: 'https://open.spotify.com/show/1KHIsaZ9mX0NbzPrfId00q',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1KHIsaZ9mX0NbzPrfId00q?utm_source=generator&theme=0',
    rssUrl: 'https://feeds.megaphone.fm/malicious-life',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/0f/29/ab/0f29ab12-4072-16eb-f3ee-91e4c5cf43f9/mza_5233473439185484131.jpg/600x600bb.jpg',
  },
  {
    id: 'hacking-humans',
    title: 'Hacking Humans',
    publisher: 'N2K Networks',
    description: 'Social engineering, phishing and the human side of cybersecurity.',
    category: 'threat-intel',
    frequency: 'Weekly',
    featured: false,
    spotifyUrl: 'https://open.spotify.com/show/3o3RNnVMosSVeSMKyX12gO',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/3o3RNnVMosSVeSMKyX12gO?utm_source=generator&theme=0',
    rssUrl: 'https://feeds.megaphone.fm/hacking-humans',
    artworkUrl: 'https://megaphone.imgix.net/podcasts/e6e0f408-1dbd-11e8-a55b-ab9da3f4c4db/image/HH_3000x3000_v3.jpg',
    artworkFallbackUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/b1/7e/82/b17e82b8-c159-c498-a472-68e9e5f3a37e/mza_11012305382498983498.jpg/626x0w.webp',
  },
  {
    id: 'security-now',
    title: 'Security Now',
    publisher: 'Steve Gibson & Leo Laporte',
    description: 'Deep technical security analysis covering vulnerabilities, exploits and defence.',
    category: 'technical',
    frequency: 'Weekly',
    featured: false,
    spotifyUrl: 'https://open.spotify.com/show/1YLB7j174leBLCuf5rDtwP',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1YLB7j174leBLCuf5rDtwP?utm_source=generator&theme=0',
    rssUrl: 'https://feeds.twit.tv/sn.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/87/fb/01/87fb01b4-5837-fa85-fb7f-51eda906d0d8/mza_7862746367695098053.jpg/600x600bb.jpg',
  },
  {
    id: 'click-here',
    title: 'Click Here',
    publisher: 'Recorded Future',
    description: 'Investigative journalism covering hacking, surveillance, disinformation and cyber conflict.',
    category: 'threat-intel',
    frequency: 'Weekly',
    featured: false,
    spotifyUrl: 'https://open.spotify.com/show/3Gmcfl6jlHexjQSLiMp72i',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/3Gmcfl6jlHexjQSLiMp72i?utm_source=generator&theme=0',
    rssUrl: 'https://feeds.megaphone.fm/clickhere',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/3f/21/52/3f215200-d8a0-f84a-0e8f-38bba90009c7/mza_8313566408285968211.png/600x600bb.jpg',
  },
  {
    id: 'sans-stormcenter',
    title: 'SANS Stormcenter Daily',
    publisher: 'SANS ISC',
    description: 'Daily 5-minute briefing on the latest threats detected by SANS sensors worldwide.',
    category: 'threat-intel',
    frequency: 'Daily',
    featured: false,
    spotifyUrl: 'https://open.spotify.com/show/1e2FxDOjQumoQMYRoXFhp1',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1e2FxDOjQumoQMYRoXFhp1?utm_source=generator&theme=0',
    rssUrl: 'https://isc.sans.edu/dailypodcast.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/80/54/ab/8054ab79-ee2b-57e9-7e09-b7461623e81b/mza_7052983095201667236.jpg/600x600bb.jpg',
  },
  {
    id: 'ciso-series',
    title: 'CISO Series',
    publisher: 'David Spark & Mike Johnson',
    description: 'Cybersecurity leadership debates on strategy, vendor management and team building.',
    category: 'leadership',
    frequency: 'Weekly',
    featured: false,
    spotifyUrl: 'https://open.spotify.com/show/5L5bVJAVDOXajLBdiuS5cM',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/5L5bVJAVDOXajLBdiuS5cM?utm_source=generator&theme=0',
    rssUrl: 'https://feeds.megaphone.fm/ciso-series',
    artworkUrl: 'https://megaphone.imgix.net/podcasts/8fa2e412-28a2-11ea-8988-2f5aa736f735/image/CISO_Podcast_3000.png',
    artworkFallbackUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/9c/f0/87/9cf087c7-f498-bcc9-c3db-92cffa3c2cc1/mza_7832873907498498498.jpg/626x0w.webp',
  },
];

const MOCK_TICKER_ITEMS: TickerItem[] = [
  { label: 'CVE-2025-0211', text: 'Critical RCE in Fortinet FortiOS — CVSS 9.8 — patch now', severity: 'critical' },
  { label: 'APT29', text: 'Cozy Bear resumes EU diplomatic phishing campaign — WINELOADER variant', severity: 'high' },
  { label: 'ZERO-DAY', text: 'Windows SmartScreen bypass exploited in the wild — no patch yet', severity: 'critical' },
  { label: 'RANSOMWARE', text: 'BlackBasta claims attack on critical infrastructure operator', severity: 'critical' },
  { label: 'CVE-2025-2299', text: 'Ivanti Connect Secure auth bypass — 30K appliances exposed', severity: 'high' },
  { label: 'APT41', text: 'Winnti-linked group targets semiconductor supply chain in Asia', severity: 'high' },
  { label: 'MALWARE', text: 'Lazarus Group deploys macOS backdoor via fake LinkedIn job PDFs', severity: 'high' },
  { label: 'PHISHING', text: 'AiTM Microsoft 365 campaign bypasses MFA — 10,000+ accounts compromised', severity: 'medium' },
  { label: 'KEV', text: 'CISA adds 3 new vulnerabilities to Known Exploited Vulnerabilities catalog', severity: 'medium' },
  { label: 'BREACH', text: 'Identity thieves bypass Experian security — credit report data exposed', severity: 'medium' },
  { label: 'ICS', text: 'New malware variant targets European water treatment SCADA systems', severity: 'high' },
  { label: 'INTEL', text: 'SANS ISC: SSH port scanning up 340% in past 48 hours', severity: 'low' },
];

// ─── Severity Config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<ThreatSeverity, { label: string; colour: string; bg: string; border: string }> = {
  critical: { label: 'CRITICAL', colour: '#E00000', bg: 'rgba(224,0,0,0.12)',   border: 'rgba(224,0,0,0.35)' },
  high:     { label: 'HIGH',     colour: '#E01515', bg: 'rgba(224,21,21,0.12)', border: 'rgba(224,21,21,0.35)' },
  medium:   { label: 'MEDIUM',   colour: '#D43A1A', bg: 'rgba(212,58,26,0.12)', border: 'rgba(212,58,26,0.35)' },
  low:      { label: 'LOW',      colour: '#C46A2A', bg: 'rgba(196,106,42,0.12)',border: 'rgba(196,106,42,0.35)' },
  info:     { label: 'INFO',     colour: '#8A8F98', bg: 'rgba(138,143,152,0.12)',border: 'rgba(138,143,152,0.35)' },
};

const SEV_ORDER: Record<ThreatSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

// ─── Helper ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type Tab = 'news' | 'podcasts' | 'channels' | 'alerts' | 'analysis';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

function NewsHeader({ activeTab, onTabChange, searchQuery, onSearchChange }: HeaderProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'news', label: 'Live News' },
    { id: 'channels', label: 'Channels' },
    { id: 'podcasts', label: 'Podcasts' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'analysis', label: 'Analysis' },
  ];

  const searchPlaceholder =
    activeTab === 'channels' ? 'Search channels...' : 'Search alerts...';

  return (
    <div className="sticky top-0 z-10 bg-cyber-panel border-b border-cyber-border">
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg">🛡️</span>
          <div>
            <div className="text-[11px] font-display font-bold tracking-widest text-accent-cyan uppercase">
              Cyber Intel
            </div>
            <div className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">
              Intelligence Feed
            </div>
          </div>
        </div>

        {/* Live badge */}
        <span className="flex items-center gap-1 bg-threat-critical/15 border border-threat-critical/40 text-threat-critical text-[8px] font-mono font-bold px-2 py-0.5 rounded-sm flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-threat-critical animate-pulse inline-block" />
          LIVE
        </span>

        {/* Tabs */}
        <nav className="flex items-center gap-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-cyber-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Search */}
        <div className="relative flex-shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 text-[10px]">⌕</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-cyber-card border border-cyber-border text-gray-300 text-[10px] font-mono pl-6 pr-3 py-1.5 rounded-sm w-48 focus:outline-none focus:border-accent-cyan/50 placeholder-gray-700"
          />
        </div>

        {/* Settings */}
        <button className="text-gray-600 hover:text-gray-400 transition-colors text-base flex-shrink-0" title="Settings">
          ⚙
        </button>
      </div>
    </div>
  );
}

function FeaturedAlert({ alert }: { alert: NewsAlert }) {
  const cfg = SEVERITY_CONFIG[alert.severity];
  const url = sanitiseUrl(alert.link);

  return (
    <div
      className="rounded border flex flex-col gap-3 p-5 h-full"
      style={{
        background: 'linear-gradient(135deg, #050608 0%, #0B0D10 60%, #111419 100%)',
        borderColor: cfg.border,
        boxShadow: `0 0 30px ${cfg.colour}10`,
      }}
    >
      {/* Top badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm"
          style={{ color: cfg.colour, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>
        <span className="text-[9px] font-mono text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-2 py-0.5 rounded-sm">
          {alert.category}
        </span>
        {alert.cve && (
          <span className="text-[9px] font-mono text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 px-2 py-0.5 rounded-sm">
            {alert.cve}
          </span>
        )}
        <span className="text-[9px] font-mono text-gray-500 ml-auto">{timeAgo(alert.publishedAt)}</span>
      </div>

      {/* Headline */}
      <h2
        className="text-sm font-sans font-semibold leading-snug"
        style={{ color: cfg.colour, textShadow: `0 0 20px ${cfg.colour}40` }}
      >
        {alert.title}
      </h2>

      {/* Description */}
      <p className="text-[11px] font-mono text-gray-400 leading-relaxed flex-1">
        {alert.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[9px] font-mono text-gray-600">
          Source: <span className="text-gray-400">{alert.source}</span>
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono text-accent-cyan hover:text-white transition-colors border border-accent-cyan/30 hover:border-accent-cyan/60 px-2 py-0.5 rounded-sm"
          >
            Read More →
          </a>
        )}
      </div>
    </div>
  );
}

interface StatBoxProps { value: number | string; label: string; colour: string; icon: string }

function StatBox({ value, label, colour, icon }: StatBoxProps) {
  return (
    <div
      className="bg-cyber-card rounded border p-3 flex flex-col gap-1"
      style={{ borderColor: `${colour}30` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[18px] font-display font-bold" style={{ color: colour }}>
          {value}
        </span>
        <span className="text-base opacity-70">{icon}</span>
      </div>
      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StatsSidebar({ alerts }: { alerts: NewsAlert[] }) {
  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const apts = alerts.filter((a) => a.category === 'APT').length;
  const zeroDays = alerts.filter((a) => a.category === 'Zero-Day').length;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest pb-1 border-b border-cyber-border">
        Today's Intelligence
      </div>
      <StatBox value={alerts.length} label="Total Alerts Today" colour="#E01515" icon="📡" />
      <StatBox value={critical} label="Critical Severity" colour="#E00000" icon="🔴" />
      <StatBox value={apts} label="APT Groups Active" colour="#E01515" icon="🎯" />
      <StatBox value={zeroDays} label="Zero-Days Detected" colour="#8B0A0A" icon="⚡" />
      <div className="mt-auto pt-3 border-t border-cyber-border">
        <div className="text-[8px] font-mono text-gray-700 leading-relaxed">
          Data reflects mock intelligence feed. Connect live APIs for real-time data.
        </div>
      </div>
    </div>
  );
}

interface FilterBarProps {
  threatFilter: ThreatSeverity | 'all';
  onThreatFilter: (f: ThreatSeverity | 'all') => void;
  sortBy: 'date' | 'severity' | 'category';
  onSortBy: (s: 'date' | 'severity' | 'category') => void;
  resultCount: number;
}

function FilterBar({ threatFilter, onThreatFilter, sortBy, onSortBy, resultCount }: FilterBarProps) {
  const levels: (ThreatSeverity | 'all')[] = ['all', 'critical', 'high', 'medium', 'low', 'info'];

  return (
    <div className="flex items-center gap-3 py-3 flex-wrap">
      <span className="text-[9px] font-mono text-gray-600 uppercase tracking-wider flex-shrink-0">Filter:</span>
      <div className="flex gap-1 flex-wrap">
        {levels.map((lvl) => {
          const isActive = threatFilter === lvl;
          const colour = lvl === 'all' ? '#8A8F98' : SEVERITY_CONFIG[lvl].colour;
          return (
            <button
              key={lvl}
              onClick={() => onThreatFilter(lvl)}
              className="px-2 py-0.5 text-[8px] font-mono uppercase rounded-sm border transition-colors"
              style={{
                color: isActive ? colour : '#555',
                borderColor: isActive ? colour : 'rgba(224,21,21,0.15)',
                background: isActive ? `${colour}15` : 'transparent',
              }}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-[9px] font-mono text-gray-600">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-wider">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortBy(e.target.value as 'date' | 'severity' | 'category')}
          className="bg-cyber-card border border-cyber-border text-gray-400 text-[9px] font-mono px-2 py-1 rounded-sm focus:outline-none focus:border-accent-cyan/50"
        >
          <option value="date">Date</option>
          <option value="severity">Severity</option>
          <option value="category">Category</option>
        </select>
      </div>
    </div>
  );
}

function ChannelCard({ channel, expanded, onToggle }: { channel: NewsChannel; expanded: boolean; onToggle: () => void }) {
  return (
    <div
      className="hud-panel cursor-pointer transition-all duration-200 hover:bg-cyber-hover/40"
      style={{ borderColor: expanded ? channel.color : undefined }}
      onClick={onToggle}
    >
      <div className="p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="text-[11px] font-sans font-semibold leading-tight"
            style={{ color: channel.color }}
          >
            {channel.name}
          </span>
          <span
            className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
              channel.updateLabel === 'LIVE'
                ? 'text-threat-critical bg-threat-critical/10 border border-threat-critical/30'
                : 'text-gray-500 bg-cyber-card border border-cyber-border'
            }`}
          >
            {channel.updateLabel === 'LIVE' && (
              <span className="inline-block w-1 h-1 rounded-full bg-threat-critical animate-pulse mr-1" />
            )}
            {channel.updateLabel}
          </span>
        </div>

        <p className="text-[9px] font-mono text-gray-500 leading-snug mb-2">
          {channel.description}
        </p>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          {channel.categories.map((cat) => (
            <span
              key={cat}
              className="text-[7px] font-mono px-1.5 py-0.5 rounded-sm border border-cyber-border text-gray-600"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Expand indicator */}
        <div className="text-[8px] font-mono text-gray-700 text-right">
          {expanded ? '▲ hide' : '▼ headlines'}
        </div>
      </div>

      {/* Expanded headlines */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? '160px' : '0px' }}
      >
        <div className="border-t border-cyber-border px-3 py-2 space-y-1.5">
          {channel.headlines.map((headline, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[8px] text-gray-700 flex-shrink-0 mt-0.5">›</span>
              <span className="text-[9px] font-mono text-gray-400 leading-snug">
                {truncate(headline, 80)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelsGrid({ expandedChannel, onToggle }: { expandedChannel: string | null; onToggle: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-mono font-semibold text-accent-cyan uppercase tracking-widest">
          📺 Intelligence Channels
        </span>
        <div className="flex-1 h-px bg-cyber-border" />
        <span className="text-[8px] font-mono text-gray-600">{MOCK_CHANNELS.length} sources</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {MOCK_CHANNELS.map((ch) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            expanded={expandedChannel === ch.id}
            onToggle={() => onToggle(ch.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LegacyPodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <div className="hud-panel flex-shrink-0 w-56 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{podcast.icon}</span>
        <div>
          <div className="text-[10px] font-sans font-semibold text-gray-300">{podcast.name}</div>
          <div className="text-[8px] font-mono text-gray-600">{podcast.date}</div>
        </div>
      </div>
      <div className="text-[9px] font-mono text-accent-cyan leading-snug">
        {truncate(podcast.episodeTitle, 50)}
      </div>
      <p className="text-[8px] font-mono text-gray-500 leading-relaxed flex-1">
        {truncate(podcast.description, 100)}
      </p>
      <div className="flex items-center justify-between pt-1 border-t border-cyber-border">
        <span className="text-[8px] font-mono text-gray-600">⏱ {podcast.duration}</span>
        <button className="text-[8px] font-mono text-accent-cyan hover:text-white border border-accent-cyan/30 hover:border-accent-cyan/60 px-2 py-0.5 rounded-sm transition-colors">
          ▶ Play
        </button>
      </div>
    </div>
  );
}

function PodcastsRow() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-mono font-semibold text-accent-cyan uppercase tracking-widest">
          🎙️ Top Podcasts
        </span>
        <div className="flex-1 h-px bg-cyber-border" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {MOCK_PODCASTS.map((p) => (
          <LegacyPodcastCard key={p.id} podcast={p} />
        ))}
      </div>
    </div>
  );
}

// ─── Podcast Category Badge ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<CyberPodcast['category'], string> = {
  'threat-intel': 'THREAT INTEL',
  'news':         'NEWS',
  'technical':    'TECHNICAL',
  'leadership':   'LEADERSHIP',
  'offensive':    'OFFENSIVE',
};

function CategoryBadge({ category }: { category: CyberPodcast['category'] }) {
  return (
    <span
      className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border"
      style={{
        color: 'rgba(224,21,21,0.9)',
        borderColor: 'rgba(224,21,21,0.3)',
        background: 'rgba(224,21,21,0.07)',
      }}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  return (
    <span className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border border-cyber-border text-gray-500">
      {frequency}
    </span>
  );
}

// ─── Podcast Artwork ──────────────────────────────────────────────────────────

function PodcastArtwork({
  artworkUrl,
  artworkFallbackUrl,
  title,
  size,
}: {
  artworkUrl: string | null;
  artworkFallbackUrl?: string;
  title: string;
  size: number;
}) {
  const initials = title
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {artworkUrl && (
        <img
          src={artworkUrl}
          alt=""
          style={{ width: size, height: size, borderRadius: 6, objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.triedFallback && artworkFallbackUrl) {
              target.dataset.triedFallback = 'true';
              target.src = artworkFallbackUrl;
            } else {
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'flex';
            }
          }}
        />
      )}
      {/* Initials tile — shown when artworkUrl is null or the image fails */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          background: 'linear-gradient(135deg, rgba(224,21,21,0.25), rgba(8,9,12,0.9))',
          border: '1px solid rgba(224,21,21,0.2)',
          display: artworkUrl ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: size * 0.32, fontWeight: 700, color: 'rgba(224,21,21,0.7)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
          {initials}
        </span>
      </div>
    </>
  );
}

// ─── Podcast Cards ────────────────────────────────────────────────────────────

function PodcastCard({
  podcast,
  isSelected,
  onPlay,
  featured = false,
}: {
  podcast: CyberPodcast;
  isSelected: boolean;
  onPlay: (id: string) => void;
  featured?: boolean;
}) {
  const artworkSize = featured ? 72 : 56;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: featured ? 16 : 12,
        borderRadius: 4,
        border: `1px solid ${isSelected ? 'rgba(224,21,21,0.5)' : 'rgba(224,21,21,0.12)'}`,
        borderLeft: `3px solid ${isSelected ? '#E01515' : 'transparent'}`,
        background: isSelected ? 'rgba(224,21,21,0.05)' : 'rgba(8,9,12,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isSelected ? '0 0 16px rgba(224,21,21,0.1)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(224,21,21,0.35)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 12px rgba(224,21,21,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(224,21,21,0.12)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }
      }}
    >
      {featured && (
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#E01515',
            border: '1px solid rgba(224,21,21,0.4)',
            background: 'rgba(224,21,21,0.1)',
            padding: '2px 6px',
            borderRadius: 2,
            textShadow: '0 0 8px rgba(224,21,21,0.6)',
          }}
        >
          ★ FEATURED
        </span>
      )}

      {/* Header row: artwork + title + publisher */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingRight: featured ? 80 : 0 }}>
        <div style={{ flexShrink: 0, width: artworkSize, height: artworkSize, borderRadius: 6, overflow: 'hidden', background: 'rgba(224,21,21,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PodcastArtwork artworkUrl={podcast.artworkUrl} artworkFallbackUrl={podcast.artworkFallbackUrl} title={podcast.title} size={artworkSize} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            style={{
              fontSize: featured ? 13 : 11,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#E8E8E8',
              lineHeight: 1.3,
              textShadow: isSelected ? '0 0 8px rgba(224,21,21,0.5)' : 'none',
              margin: 0,
              wordBreak: 'break-word',
            }}
          >
            {podcast.title}
          </h3>
          <p style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#8A8F98', margin: '3px 0 0' }}>
            {podcast.publisher}
          </p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: featured ? 10 : 9, fontFamily: 'Inter, sans-serif', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
        {podcast.description}
      </p>

      {/* Footer: badges + buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(224,21,21,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 2 }}>
            {podcast.frequency}
          </span>
          <span style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(224,21,21,0.85)', border: '1px solid rgba(224,21,21,0.3)', background: 'rgba(224,21,21,0.07)', padding: '2px 6px', borderRadius: 2 }}>
            {CATEGORY_LABELS[podcast.category] ?? podcast.category}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {podcast.spotifyEmbedUrl ? (
            <button
              onClick={() => onPlay(podcast.id)}
              style={{
                fontSize: 8,
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: isSelected ? '#fff' : '#E01515',
                border: '1px solid rgba(224,21,21,0.5)',
                background: isSelected ? 'rgba(224,21,21,0.25)' : 'transparent',
                padding: '3px 10px',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {isSelected ? '▶ PLAYING' : '▶ PLAY'}
            </button>
          ) : podcast.spotifyUrl ? (
            <a
              href={podcast.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1DB954', border: '1px solid rgba(29,185,84,0.4)', background: 'rgba(29,185,84,0.07)', padding: '3px 10px', borderRadius: 2, textDecoration: 'none' }}
            >
              Open in Spotify
            </a>
          ) : (
            <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: '#4B5563', border: '1px solid rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 2 }}>
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Full Podcasts Page ────────────────────────────────────────────────────────

type PodcastCategory = CyberPodcast['category'] | 'all';

const FILTER_TABS: { id: PodcastCategory; label: string }[] = [
  { id: 'all',          label: 'ALL' },
  { id: 'threat-intel', label: 'THREAT INTEL' },
  { id: 'news',         label: 'NEWS' },
  { id: 'technical',    label: 'TECHNICAL' },
  { id: 'leadership',   label: 'LEADERSHIP' },
  { id: 'offensive',    label: 'OFFENSIVE' },
];

function PodcastsPage() {
  const [activeCategory, setActiveCategory] = useState<PodcastCategory>('all');
  const [selectedPodcast, setSelectedPodcast] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodesError, setEpisodesError] = useState<string | null>(null);

  const featured = CYBER_PODCASTS.filter((p) => p.featured);
  const allFiltered = CYBER_PODCASTS.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory,
  );
  const selectedPodcastData = selectedPodcast
    ? CYBER_PODCASTS.find((p) => p.id === selectedPodcast) ?? null
    : null;

  const fetchEpisodes = async (podcast: CyberPodcast) => {
    setEpisodesLoading(true);
    setEpisodesError(null);
    setEpisodes([]);
    try {
      const params = new URLSearchParams({ name: podcast.title });
      if (podcast.rssUrl) params.set('rssUrl', podcast.rssUrl);
      const response = await fetch(`/api/podcast-episodes?${params.toString()}`);
      const data = await response.json();
      if (data.ok && Array.isArray(data.episodes) && data.episodes.length > 0) {
        const mapped: PodcastEpisode[] = data.episodes.map(
          (item: { title: string; link: string; description: string; pubDate: string }, i: number) => ({
            id: item.link || `ep-${i}`,
            title: item.title || 'Untitled',
            description: item.description || '',
            publishedAt: item.pubDate || '',
            durationMs: 0,
            thumbnailUrl: '',
            externalUrl: item.link || podcast.spotifyUrl || '',
          })
        );
        setEpisodes(mapped);
      } else {
        setEpisodesError(data.error || 'No episodes found');
      }
    } catch {
      setEpisodesError('Failed to load episodes');
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handlePlay = (id: string) => {
    if (selectedPodcast === id) {
      setSelectedPodcast(null);
      setEpisodes([]);
      setEpisodesError(null);
      return;
    }
    setSelectedPodcast(id);
    const podcast = CYBER_PODCASTS.find((p) => p.id === id);
    if (podcast) {
      fetchEpisodes(podcast);
    }
  };

  if (CYBER_PODCASTS.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        No podcasts available
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── NOW PLAYING player ── */}
      {selectedPodcastData && (
        <div style={{ background: 'rgba(8,9,12,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(224,21,21,0.2)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: '#E01515', textTransform: 'uppercase', letterSpacing: '0.12em', textShadow: '0 0 8px rgba(224,21,21,0.5)' }}>
                ▶ NOW PLAYING
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#E8E8E8' }}>
                {selectedPodcastData.title}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#8A8F98' }}>
                {selectedPodcastData.publisher}
              </span>
            </div>
            <button
              onClick={() => { setSelectedPodcast(null); setEpisodes([]); setEpisodesError(null); }}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}
              aria-label="Close player"
            >
              ✕
            </button>
          </div>
          {selectedPodcastData.spotifyEmbedUrl ? (
            <iframe
              key={selectedPodcast}
              src={selectedPodcastData.spotifyEmbedUrl}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: 8, border: 'none', display: 'block' }}
              title={`${selectedPodcastData.title} on Spotify`}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6B7280' }}>
                Embed unavailable —{' '}
              </span>
              {selectedPodcastData.spotifyUrl && (
                <a href={selectedPodcastData.spotifyUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1DB954', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                  Open in Spotify →
                </a>
              )}
            </div>
          )}

          {/* ── Episode browser ── */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#E8E8E8', textShadow: '0 0 8px rgba(224,21,21,0.4)' }}>
                Latest Episodes
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(224,21,21,0.12)' }} />
              {episodes.length > 0 && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#6B7280' }}>
                  {episodes.length} episodes
                </span>
              )}
            </div>

            {/* Loading */}
            {episodesLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '24px 0' }}>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(224,21,21,0.15)', borderTop: '2px solid #E01515', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6B7280' }}>Loading episodes...</span>
              </div>
            )}

            {/* Error */}
            {episodesError && !episodesLoading && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#E01515' }}>{episodesError}</span>
                {selectedPodcastData.spotifyUrl && (
                  <a
                    href={selectedPodcastData.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#1DB954' }}
                  >
                    Open in Spotify →
                  </a>
                )}
              </div>
            )}

            {/* Episode list */}
            {!episodesLoading && !episodesError && episodes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {episodes.map((ep, index) => (
                  <a
                    key={ep.id}
                    href={ep.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(224,21,21,0.08)',
                      background: 'rgba(224,21,21,0.02)',
                      textDecoration: 'none',
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(224,21,21,0.07)';
                      e.currentTarget.style.borderColor = 'rgba(224,21,21,0.22)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(224,21,21,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(224,21,21,0.08)';
                    }}
                  >
                    {/* Number */}
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: 'rgba(224,21,21,0.35)', minWidth: 20, paddingTop: 2, flexShrink: 0 }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500, color: '#E8E8E8', marginBottom: 2, lineHeight: 1.35 }}>
                        {ep.title}
                      </div>
                      {ep.description && (
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#8A8F98', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ep.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                        {ep.publishedAt && (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#6B7280' }}>
                            {new Date(ep.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {ep.durationMs > 0 && (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#6B7280' }}>
                            {Math.round(ep.durationMs / 60000)} min
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Play arrow */}
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(224,21,21,0.4)', paddingTop: 2, flexShrink: 0 }}>▶</span>
                  </a>
                ))}
              </div>
            )}

            {/* Empty */}
            {!episodesLoading && !episodesError && episodes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4B5563' }}>No episodes found</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Featured ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#E01515', textShadow: '0 0 8px rgba(224,21,21,0.5)', whiteSpace: 'nowrap' }}>
            ★ Featured Podcasts
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(224,21,21,0.15)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {featured.map((p) => (
            <PodcastCard key={p.id} podcast={p} isSelected={selectedPodcast === p.id} onPlay={handlePlay} featured />
          ))}
        </div>
      </section>

      {/* ── Category filters + grid ── */}
      <section>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {FILTER_TABS.map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  fontSize: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '4px 12px',
                  borderRadius: 2,
                  border: `1px solid ${active ? 'rgba(224,21,21,0.5)' : 'rgba(224,21,21,0.12)'}`,
                  background: active ? 'rgba(224,21,21,0.1)' : 'transparent',
                  color: active ? '#E01515' : '#8A8F98',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {allFiltered.length === 0 ? (
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4B5563', textAlign: 'center', padding: '40px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            No podcasts in this category
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {allFiltered.map((p) => (
              <PodcastCard key={p.id} podcast={p} isSelected={selectedPodcast === p.id} onPlay={handlePlay} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LiveTicker() {
  const doubled = [...MOCK_TICKER_ITEMS, ...MOCK_TICKER_ITEMS];

  return (
    <div className="flex-shrink-0 border-t border-threat-critical/30 bg-[rgba(224,21,21,0.06)] overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-threat-critical/15 border-r border-threat-critical/30">
          <span className="w-1.5 h-1.5 rounded-full bg-threat-critical animate-pulse" />
          <span className="text-[8px] font-mono font-bold text-threat-critical uppercase tracking-widest">
            Alerts
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex animate-ticker-scroll whitespace-nowrap"
            style={{ animationDuration: '40s' }}
          >
            {doubled.map((item, i) => {
              const cfg = SEVERITY_CONFIG[item.severity];
              return (
                <span key={i} className="inline-flex items-center gap-2 px-4 py-2">
                  <span
                    className="text-[7px] font-mono font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0"
                    style={{ color: cfg.colour, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">{item.text}</span>
                  <span className="text-gray-700 mx-2">·</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="text-center">
        <div className="text-3xl mb-3">🔧</div>
        <div className="text-[11px] font-mono text-gray-500">{label} — coming soon</div>
        <div className="text-[9px] font-mono text-gray-700 mt-1">Connect real APIs to enable this view</div>
      </div>
    </div>
  );
}

// ─── Full-Page Channels View ──────────────────────────────────────────────────

function ChannelsPageView({ searchQuery }: { searchQuery: string }) {
  const liveChannels = useCyberStore((state) => state.liveChannels);
  const selectedChannelId = useCyberStore((state) => state.selectedChannelId);
  const selectChannel = useCyberStore((state) => state.selectChannel);
  const setLiveChannels = useCyberStore((state) => state.setLiveChannels);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const liveUrls = useYoutubeLiveUrls();

  useEffect(() => {
    setLiveChannels(LIVE_CHANNELS);
  }, [setLiveChannels]);

  const categories = useMemo<string[]>(
    () => ['all', ...new Set(liveChannels.map((c) => c.category))],
    [liveChannels],
  );

  const filteredChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return liveChannels.filter((ch) => {
      const matchesCat = categoryFilter === 'all' || ch.category === categoryFilter;
      if (!q) return matchesCat;
      const hay = [ch.name, ch.region, ch.category, ...(ch.tags ?? [])].join(' ').toLowerCase();
      return matchesCat && hay.includes(q);
    });
  }, [liveChannels, categoryFilter, searchQuery]);

  const selectedChannel = useMemo(
    () => filteredChannels.find((c) => c.id === selectedChannelId) ?? filteredChannels[0] ?? null,
    [filteredChannels, selectedChannelId],
  );

  useEffect(() => {
    if (filteredChannels.length === 0) return;
    if (!selectedChannel) selectChannel(filteredChannels[0].id);
  }, [filteredChannels, selectChannel, selectedChannel]);

  const liveEntry = selectedChannel ? liveUrls[selectedChannel.id] : undefined;
  const embedUrl = liveEntry?.embedUrl ?? null;
  const websiteUrl = selectedChannel ? getChannelWebsiteUrl(selectedChannel) : null;
  const popoutUrl = embedUrl ?? websiteUrl;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Category filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded-sm border transition-colors ${
              categoryFilter === cat
                ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                : 'border-cyber-border text-gray-500 hover:text-gray-300 hover:bg-cyber-hover'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Channel list */}
      <div className="space-y-1 mb-6">
        {filteredChannels.map((channel) => {
          const entry = liveUrls[channel.id];
          return (
            <button
              key={channel.id}
              onClick={() => selectChannel(channel.id)}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-md transition-all text-left ${
                selectedChannel?.id === channel.id
                  ? 'border-l-2 border-accent-cyan bg-accent-cyan/5'
                  : 'border-l-2 border-transparent hover:bg-cyber-hover/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-mono text-gray-200 truncate">{channel.name}</span>
                <span className="text-xs font-mono text-gray-500 flex-shrink-0">{channel.region}</span>
                {entry?.isLive && (
                  <span className="text-[8px] font-mono text-threat-critical bg-threat-critical/10 border border-threat-critical/30 px-1.5 py-0.5 rounded flex-shrink-0">LIVE</span>
                )}
                {entry && !entry.isLive && entry.embedUrl && (
                  <span className="text-[8px] font-mono text-gray-500 bg-cyber-card border border-cyber-border px-1.5 py-0.5 rounded flex-shrink-0">REPLAY</span>
                )}
                {entry && !entry.embedUrl && (
                  <span className="text-[8px] font-mono text-gray-600 bg-cyber-card border border-cyber-border px-1.5 py-0.5 rounded flex-shrink-0">OFFLINE</span>
                )}
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyber-border text-gray-400 uppercase flex-shrink-0 ml-2">
                {channel.category}
              </span>
            </button>
          );
        })}

        {filteredChannels.length === 0 && (
          <div className="py-8 text-center text-[10px] font-mono text-gray-600">
            No channels match — clear the filter to restore feeds.
          </div>
        )}
      </div>

      {/* Video player */}
      {selectedChannel && (
        <div className="border border-cyber-border rounded-md overflow-hidden bg-cyber-card">
          {/* Channel header bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-accent-cyan font-semibold">{selectedChannel.name}</span>
              <span className="text-xs font-mono text-gray-500">{selectedChannel.region}</span>
              {liveEntry?.isLive && (
                <span className="text-[8px] font-mono text-threat-critical bg-threat-critical/10 border border-threat-critical/30 px-1.5 py-0.5 rounded">LIVE</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-accent-cyan border border-accent-cyan/30 px-2 py-1 rounded hover:bg-accent-cyan/10"
                >
                  OPEN SOURCE
                </a>
              )}
              {popoutUrl && (
                <a
                  href={popoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-gray-400 border border-cyber-border px-2 py-1 rounded hover:bg-cyber-hover"
                >
                  POP OUT
                </a>
              )}
            </div>
          </div>
          {/* Video — fixed height for reliable fill */}
          {embedUrl ? (
            <div style={{ width: '100%', height: '540px' }}>
              <iframe
                key={`${selectedChannel.id}-${embedUrl}`}
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 'none', display: 'block' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-black" style={{ height: '540px' }}>
              <div className="text-center">
                <span className="text-gray-500 text-sm font-mono block mb-1">
                  {liveEntry === undefined ? 'Loading stream...' : 'Stream offline'}
                </span>
                <span className="text-gray-600 text-xs font-mono">
                  {selectedChannel.name} is not currently broadcasting live
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Signal Chain (Live News Timeline) ────────────────────────────────────────

function scSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    critical: '#E00000',
    high:     '#E01515',
    elevated: '#D43A1A',
    medium:   '#C46A2A',
    low:      '#8A8F98',
    info:     '#6B7280',
  };
  return map[severity] ?? '#8A8F98';
}

function scFormatDateLabel(datetime: string): string {
  try {
    const d = new Date(datetime);
    if (isNaN(d.getTime())) return datetime;
    const hour = d.getHours();
    const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + period;
  } catch {
    return datetime;
  }
}

function scIsWithinHours(datetime: string, hours: number): boolean {
  try {
    return Date.now() - new Date(datetime).getTime() < hours * 3_600_000;
  } catch {
    return false;
  }
}

function scRelativeTime(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.round(diffMs / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.round(diffHr / 24)}d ago`;
  } catch {
    return '';
  }
}

function scMapSeverity(sev: string): string {
  if (sev === 'critical') return 'critical';
  if (sev === 'high')     return 'high';
  if (sev === 'medium')   return 'elevated';
  if (sev === 'low')      return 'medium';
  return 'low';
}

function SignalStatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{
      background: 'rgba(8,9,12,0.6)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(224,21,21,0.12)',
      borderRadius: 6,
      padding: '12px 16px',
      minWidth: 130,
      flex: '1 1 130px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#E8E8E8', fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: 16, opacity: 0.8 }}>{icon}</span>
      </div>
      <span style={{ color: '#8A8F98', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginTop: 6 }}>
        {label}
      </span>
    </div>
  );
}

function SignalChain() {
  const { clusters } = useCyberStore();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Map clusters → timeline events (tick causes re-render so relativeTime stays fresh)
  const events = clusters
    .slice(0, 40)
    .map((cluster) => {
      const dt = typeof cluster.primary.publishedAt === 'string'
        ? cluster.primary.publishedAt
        : new Date(cluster.primary.publishedAt).toISOString();
      return {
        id: cluster.id,
        title: cluster.primary.title,
        summary: cluster.primary.description || cluster.primary.title,
        severity: scMapSeverity(cluster.severity),
        datetime: dt,
        relativeTime: scRelativeTime(cluster.primary.publishedAt),
        source: cluster.primary.source,
        link: cluster.primary.link,
        sourceCount: cluster.sourceCount,
        category: cluster.primary.category,
        cves: cluster.primary.cves ?? [],
        // suppress lint: tick is used only to trigger recalculation
        _tick: tick,
      };
    })
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const critical = events.filter((e) => e.severity === 'critical').length;
  const high     = events.filter((e) => e.severity === 'high').length;
  const active   = events.filter((e) => scIsWithinHours(e.datetime, 6)).length;

  if (clusters.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 12 }}>
        <div style={{ width: 24, height: 24, border: '2px solid rgba(224,21,21,0.15)', borderTop: '2px solid #E01515', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#8A8F98', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          Waiting for feed data...
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '20px 24px' }}>

      {/* ── Summary stat bar ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <SignalStatCard label="Total Signals" value={events.length} icon="📡" />
        <SignalStatCard label="Critical"       value={critical}       icon="🔴" />
        <SignalStatCard label="High"           value={high}           icon="🟠" />
        <SignalStatCard label="Active (6h)"    value={active}         icon="⚡" />
      </div>

      {/* ── Section label ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#E01515', textShadow: '0 0 8px rgba(224,21,21,0.5)', whiteSpace: 'nowrap' }}>
          ◈ Signal Chain
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(224,21,21,0.15)' }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4B5563' }}>
          {events.length} events · sorted newest first
        </span>
      </div>

      {/* ── Timeline ── */}
      <div style={{ position: 'relative' }}>

        {/* Continuous vertical line */}
        <div style={{
          position: 'absolute',
          left: 15,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'linear-gradient(to bottom, rgba(224,21,21,0.45), rgba(224,21,21,0.05))',
          pointerEvents: 'none',
        }} />

        {events.map((event) => {
          const color = scSeverityColor(event.severity);
          return (
            <a
              key={event.id}
              href={sanitiseUrl(event.link) || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '11px 8px 11px 0',
                borderBottom: '1px solid rgba(224,21,21,0.06)',
                position: 'relative',
                textDecoration: 'none',
                borderRadius: 4,
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224,21,21,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Node on timeline */}
              <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0, paddingTop: 5, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: color,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 8px ${color}70, 0 0 16px ${color}30`,
                }} />
              </div>

              {/* Event card */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    color,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    textShadow: `0 0 8px ${color}40`,
                    lineHeight: 1.3,
                  }}>
                    {event.title}
                  </span>
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '2px 6px',
                    borderRadius: 3,
                    color,
                    background: `${color}15`,
                    border: `1px solid ${color}35`,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {event.severity}
                  </span>
                  {event.category && (
                    <span style={{
                      fontSize: 9,
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '2px 6px',
                      borderRadius: 3,
                      color: '#8A8F98',
                      background: 'rgba(138,143,152,0.1)',
                      border: '1px solid rgba(138,143,152,0.2)',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      {event.category}
                    </span>
                  )}
                  {event.sourceCount > 1 && (
                    <span style={{
                      fontSize: 9,
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '2px 6px',
                      borderRadius: 3,
                      color: 'rgba(224,21,21,0.6)',
                      background: 'rgba(224,21,21,0.08)',
                      border: '1px solid rgba(224,21,21,0.15)',
                      flexShrink: 0,
                    }}>
                      {event.sourceCount} sources
                    </span>
                  )}
                </div>

                {/* Summary */}
                <p style={{
                  color: '#C0C0C0',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  lineHeight: 1.5,
                  margin: '0 0 5px 0',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {event.summary}
                </p>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {event.source && (
                    <span style={{ color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                      {event.source}
                    </span>
                  )}
                  <span style={{ color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>·</span>
                  <span style={{ color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                    {scFormatDateLabel(event.datetime)}
                  </span>
                  {event.cves.length > 0 && (
                    <>
                      <span style={{ color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>·</span>
                      <span style={{ color: '#60A5FA', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                        {event.cves.slice(0, 2).join(' ')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Relative time — far right */}
              <div style={{ flexShrink: 0, paddingTop: 5, minWidth: 52, textAlign: 'right' }}>
                <span style={{ color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, whiteSpace: 'nowrap' }}>
                  {event.relativeTime}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CybersecurityNews() {
  const [activeTab, setActiveTab] = useState<Tab>('news');
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<ThreatSeverity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'category'>('date');
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    let result = MOCK_ALERTS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    if (threatFilter !== 'all') {
      result = result.filter((a) => a.severity === threatFilter);
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortBy === 'severity') return SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
      return a.category.localeCompare(b.category);
    });
  }, [searchQuery, threatFilter, sortBy]);

  const featuredAlert = filteredAlerts[0] ?? MOCK_ALERTS[0];

  function handleChannelToggle(id: string) {
    setExpandedChannel((prev) => (prev === id ? null : id));
  }

  return (
    <div className="bg-cyber-bg min-h-screen flex flex-col font-sans">
      <NewsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 flex flex-col overflow-auto">
        {activeTab === 'news' && (
          <div className="flex-1 overflow-auto">
            <SignalChain />
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="flex-1 overflow-auto">
            <ChannelsPageView searchQuery={searchQuery} />
          </div>
        )}

        {activeTab === 'podcasts' && (
          <div className="flex-1 overflow-auto">
            <PodcastsPage />
          </div>
        )}

        {activeTab === 'alerts' && <ComingSoon label="Alerts" />}
        {activeTab === 'analysis' && <ComingSoon label="Analysis" />}
      </div>

      <LiveTicker />
    </div>
  );
}
