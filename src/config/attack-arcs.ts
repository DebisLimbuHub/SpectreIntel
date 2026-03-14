/**
 * Attack Vector Arcs — Active cyber campaign paths.
 * These represent known/reported attack vectors from threat actors to targets.
 *
 * Data derived from recent APT campaign attributions.
 * In production, these would be populated dynamically from threat intel feeds.
 */

import type { AttackArc } from '@/types';

export const ATTACK_ARCS: AttackArc[] = [
  // ===== RUSSIA → TARGETS =====
  {
    id: 'arc-apt28-nato',
    fromLat: 55.7558, fromLng: 37.6173,     // Moscow
    toLat: 50.8503, toLng: 4.3517,           // Brussels (NATO HQ)
    severity: 'critical',
    label: 'APT28 → NATO Infrastructure',
    aptGroup: 'APT28',
  },
  {
    id: 'arc-sandworm-ua-grid',
    fromLat: 55.7558, fromLng: 37.6173,     // Moscow
    toLat: 50.4501, toLng: 30.5234,          // Kyiv
    severity: 'critical',
    label: 'Sandworm → Ukraine Power Grid',
    aptGroup: 'Sandworm',
  },
  {
    id: 'arc-apt29-us-gov',
    fromLat: 55.7558, fromLng: 37.6173,     // Moscow
    toLat: 38.9072, toLng: -77.0369,         // Washington DC
    severity: 'high',
    label: 'APT29 → US Government Networks',
    aptGroup: 'APT29',
  },
  {
    id: 'arc-turla-eu',
    fromLat: 55.7558, fromLng: 37.6173,     // Moscow
    toLat: 48.8566, toLng: 2.3522,           // Paris
    severity: 'medium',
    label: 'Turla → EU Diplomatic Missions',
    aptGroup: 'Turla',
  },
  {
    id: 'arc-sandworm-de-water',
    fromLat: 55.7558, fromLng: 37.6173,     // Moscow
    toLat: 52.5200, toLng: 13.4050,          // Berlin
    severity: 'high',
    label: 'APT28 → German Water Utilities',
    aptGroup: 'APT28',
  },

  // ===== CHINA → TARGETS =====
  {
    id: 'arc-volt-us-infra',
    fromLat: 39.9042, fromLng: 116.4074,    // Beijing
    toLat: 37.7749, toLng: -122.4194,        // San Francisco
    severity: 'critical',
    label: 'Volt Typhoon → US Critical Infrastructure',
    aptGroup: 'Volt Typhoon',
  },
  {
    id: 'arc-salt-us-telecom',
    fromLat: 39.9042, fromLng: 116.4074,    // Beijing
    toLat: 40.7128, toLng: -74.0060,         // New York
    severity: 'critical',
    label: 'Salt Typhoon → US Telecom Networks',
    aptGroup: 'Salt Typhoon',
  },
  {
    id: 'arc-apt10-jp',
    fromLat: 31.2304, fromLng: 121.4737,    // Shanghai
    toLat: 35.6762, toLng: 139.6503,         // Tokyo
    severity: 'high',
    label: 'APT10 → Japan Defence Sector',
    aptGroup: 'APT10',
  },
  {
    id: 'arc-apt41-au',
    fromLat: 30.5728, fromLng: 104.0668,    // Chengdu
    toLat: -33.8688, toLng: 151.2093,        // Sydney
    severity: 'medium',
    label: 'APT41 → AU Healthcare & Research',
    aptGroup: 'APT41',
  },
  {
    id: 'arc-apt10-uk',
    fromLat: 39.9042, fromLng: 116.4074,    // Beijing
    toLat: 51.5074, toLng: -0.1278,          // London
    severity: 'high',
    label: 'APT10 → UK Government MSPs',
    aptGroup: 'APT10',
  },

  // ===== NORTH KOREA → TARGETS =====
  {
    id: 'arc-lazarus-crypto',
    fromLat: 39.0392, fromLng: 125.7625,    // Pyongyang
    toLat: 37.5665, toLng: 126.9780,         // Seoul
    severity: 'critical',
    label: 'Lazarus → South Korean Financial Sector',
    aptGroup: 'Lazarus Group',
  },
  {
    id: 'arc-lazarus-us-bank',
    fromLat: 39.0392, fromLng: 125.7625,    // Pyongyang
    toLat: 40.7128, toLng: -74.0060,         // New York
    severity: 'high',
    label: 'Lazarus → US Banking/Crypto',
    aptGroup: 'Lazarus Group',
  },
  {
    id: 'arc-kimsuky-kr',
    fromLat: 39.0392, fromLng: 125.7625,    // Pyongyang
    toLat: 36.3504, toLng: 127.3845,         // Daejeon (KAERI)
    severity: 'high',
    label: 'Kimsuky → Korean Nuclear Research',
    aptGroup: 'Kimsuky',
  },

  // ===== IRAN → TARGETS =====
  {
    id: 'arc-apt33-sa-energy',
    fromLat: 35.6892, fromLng: 51.3890,     // Tehran
    toLat: 24.7136, toLng: 46.6753,          // Riyadh
    severity: 'critical',
    label: 'APT33 → Saudi Aramco / Energy',
    aptGroup: 'APT33',
  },
  {
    id: 'arc-apt34-gulf',
    fromLat: 35.6892, fromLng: 51.3890,     // Tehran
    toLat: 25.2048, toLng: 55.2708,          // Dubai
    severity: 'high',
    label: 'APT34 → Gulf State Government',
    aptGroup: 'APT34',
  },
  {
    id: 'arc-apt35-il',
    fromLat: 35.6892, fromLng: 51.3890,     // Tehran
    toLat: 32.0853, toLng: 34.7818,          // Tel Aviv
    severity: 'critical',
    label: 'APT35 → Israeli Infrastructure',
    aptGroup: 'APT35',
  },
  {
    id: 'arc-muddy-turkey',
    fromLat: 35.6892, fromLng: 51.3890,     // Tehran
    toLat: 39.9334, toLng: 32.8597,          // Ankara
    severity: 'medium',
    label: 'MuddyWater → Turkish Telecom',
    aptGroup: 'MuddyWater',
  },
];
