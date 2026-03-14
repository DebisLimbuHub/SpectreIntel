/**
 * Undersea Cables — Major submarine cable routes.
 * Simplified landing-point-to-landing-point paths.
 * Source reference: TeleGeography Submarine Cable Map.
 */

export interface SubseaCableConfig {
  id: string;
  name: string;
  landingPoints: { lat: number; lng: number; country: string }[];
  capacityTbps?: number;
}

export const UNDERSEA_CABLES: SubseaCableConfig[] = [
  {
    id: 'seamewe6',
    name: 'SEA-ME-WE 6',
    landingPoints: [
      { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
      { lat: 6.9271, lng: 79.8612, country: 'Sri Lanka' },
      { lat: 11.5820, lng: 43.1456, country: 'Djibouti' },
      { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
      { lat: 36.8065, lng: 10.1815, country: 'Tunisia' },
      { lat: 43.2965, lng: 5.3698, country: 'France' },
    ],
    capacityTbps: 126,
  },
  {
    id: 'transatlantic-tat14',
    name: 'TAT-14',
    landingPoints: [
      { lat: 40.5725, lng: -73.9712, country: 'US (New Jersey)' },
      { lat: 50.3785, lng: -4.1427, country: 'UK (Bude)' },
      { lat: 53.5511, lng: 8.5000, country: 'Germany' },
      { lat: 51.9244, lng: 4.4777, country: 'Netherlands' },
      { lat: 48.3794, lng: -4.4861, country: 'France' },
    ],
    capacityTbps: 3.2,
  },
  {
    id: 'aaec1',
    name: 'AAE-1',
    landingPoints: [
      { lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
      { lat: 10.8231, lng: 106.6297, country: 'Vietnam' },
      { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
      { lat: 12.9716, lng: 77.5946, country: 'India' },
      { lat: 25.2048, lng: 55.2708, country: 'UAE' },
      { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
      { lat: 36.8065, lng: 10.1815, country: 'Tunisia' },
      { lat: 43.2965, lng: 5.3698, country: 'France' },
    ],
    capacityTbps: 40,
  },
  {
    id: 'marea',
    name: 'MAREA',
    landingPoints: [
      { lat: 39.3643, lng: -74.4229, country: 'US (Virginia Beach)' },
      { lat: 43.4623, lng: -3.8100, country: 'Spain (Bilbao)' },
    ],
    capacityTbps: 224,
  },
  {
    id: 'grace-hopper',
    name: 'Grace Hopper',
    landingPoints: [
      { lat: 40.5725, lng: -73.9712, country: 'US (New York)' },
      { lat: 50.3785, lng: -4.1427, country: 'UK (Bude)' },
      { lat: 43.4623, lng: -3.8100, country: 'Spain (Bilbao)' },
    ],
    capacityTbps: 350,
  },
  {
    id: 'equiano',
    name: 'Equiano',
    landingPoints: [
      { lat: 38.7223, lng: -9.1393, country: 'Portugal' },
      { lat: 5.6037, lng: -0.1870, country: 'Ghana' },
      { lat: 6.5244, lng: 3.3792, country: 'Nigeria' },
      { lat: -4.4419, lng: 15.2663, country: 'DR Congo' },
      { lat: -33.9249, lng: 18.4241, country: 'South Africa' },
    ],
    capacityTbps: 144,
  },
  {
    id: 'peace',
    name: 'PEACE Cable',
    landingPoints: [
      { lat: 34.7473, lng: 10.7613, country: 'Tunisia' },
      { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
      { lat: 11.5820, lng: 43.1456, country: 'Djibouti' },
      { lat: 24.8607, lng: 67.0011, country: 'Pakistan' },
      { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
    ],
    capacityTbps: 96,
  },
  {
    id: 'dunant',
    name: 'Dunant',
    landingPoints: [
      { lat: 39.3643, lng: -74.4229, country: 'US (Virginia Beach)' },
      { lat: 45.5017, lng: -0.9917, country: 'France (Saint-Hilaire)' },
    ],
    capacityTbps: 250,
  },
  {
    id: 'arctic-connect',
    name: 'Arctic Connect',
    landingPoints: [
      { lat: 60.1699, lng: 24.9384, country: 'Finland' },
      { lat: 71.0, lng: 40.0, country: 'Russia (Murmansk)' },
      { lat: 69.0, lng: 140.0, country: 'Russia (Arctic)' },
      { lat: 43.0, lng: 141.3, country: 'Japan' },
    ],
    capacityTbps: 200,
  },
  {
    id: 'jupiter',
    name: 'Jupiter (Google)',
    landingPoints: [
      { lat: 33.9425, lng: -118.4081, country: 'US (Los Angeles)' },
      { lat: 25.0330, lng: 121.5654, country: 'Taiwan' },
      { lat: 35.6762, lng: 139.6503, country: 'Japan' },
    ],
    capacityTbps: 60,
  },
  {
    id: 'seamewe5',
    name: 'SEA-ME-WE 5',
    landingPoints: [
      { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
      { lat: 12.9716, lng: 77.5946, country: 'India' },
      { lat: 6.9271, lng: 79.8612, country: 'Sri Lanka' },
      { lat: 25.2048, lng: 55.2708, country: 'UAE' },
      { lat: 11.5820, lng: 43.1456, country: 'Djibouti' },
      { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
      { lat: 36.8065, lng: 10.1815, country: 'Tunisia' },
      { lat: 37.9838, lng: 23.7275, country: 'Greece' },
      { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
      { lat: 43.2965, lng: 5.3698, country: 'France' },
    ],
    capacityTbps: 24,
  },
  {
    id: 'apricot',
    name: 'APRICOT',
    landingPoints: [
      { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
      { lat: 3.1390, lng: 101.6869, country: 'Malaysia' },
      { lat: 14.5995, lng: 120.9842, country: 'Philippines' },
      { lat: 25.0330, lng: 121.5654, country: 'Taiwan' },
      { lat: 35.6762, lng: 139.6503, country: 'Japan' },
      { lat: 37.5665, lng: 126.9780, country: 'South Korea' },
    ],
    capacityTbps: 190,
  },
];
