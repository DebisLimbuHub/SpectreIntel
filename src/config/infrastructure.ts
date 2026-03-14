/**
 * Critical Infrastructure Data — Key facilities for map markers.
 * Focused on energy, water, transport, telecom sectors.
 *
 * These are well-known, publicly documented facilities.
 * In production, this would be enriched from ICS-CERT and ENISA datasets.
 */

import type { CriticalInfrastructure } from '@/types';

export const CRITICAL_INFRASTRUCTURE: CriticalInfrastructure[] = [
  // ===== UK =====
  { id: 'uk-hinckley', name: 'Hinkley Point C Nuclear', type: 'energy', lat: 51.2090, lng: -3.1296, country: 'UK', operator: 'EDF Energy', riskLevel: 'high' },
  { id: 'uk-sellafield', name: 'Sellafield Nuclear Complex', type: 'energy', lat: 54.4208, lng: -3.4983, country: 'UK', operator: 'NDA', riskLevel: 'critical' },
  { id: 'uk-national-grid', name: 'National Grid Control Centre', type: 'energy', lat: 52.4862, lng: -1.8904, country: 'UK', operator: 'National Grid ESO', riskLevel: 'critical' },
  { id: 'uk-linx', name: 'LINX (London Internet Exchange)', type: 'telecom', lat: 51.5155, lng: -0.0922, country: 'UK', operator: 'LINX', riskLevel: 'high' },
  { id: 'uk-thames-water', name: 'Thames Water Ops Centre', type: 'water', lat: 51.4700, lng: -0.4543, country: 'UK', operator: 'Thames Water', riskLevel: 'high' },
  { id: 'uk-heathrow', name: 'Heathrow ATC Systems', type: 'transport', lat: 51.4700, lng: -0.4543, country: 'UK', operator: 'NATS', riskLevel: 'medium' },
  { id: 'uk-nhs-spine', name: 'NHS Spine (Digital)', type: 'healthcare', lat: 53.8008, lng: -1.5491, country: 'UK', operator: 'NHS Digital', riskLevel: 'high' },
  { id: 'uk-boe', name: 'Bank of England', type: 'financial', lat: 51.5142, lng: -0.0885, country: 'UK', operator: 'BoE', riskLevel: 'critical' },

  // ===== US =====
  { id: 'us-eastern-grid', name: 'US Eastern Interconnection', type: 'energy', lat: 38.9072, lng: -77.0369, country: 'US', operator: 'PJM Interconnection', riskLevel: 'critical' },
  { id: 'us-hoover-dam', name: 'Hoover Dam', type: 'energy', lat: 36.0160, lng: -114.7377, country: 'US', operator: 'Bureau of Reclamation', riskLevel: 'high' },
  { id: 'us-nyse', name: 'New York Stock Exchange', type: 'financial', lat: 40.7069, lng: -74.0113, country: 'US', operator: 'NYSE/ICE', riskLevel: 'critical' },
  { id: 'us-equinix-ashburn', name: 'Equinix Ashburn Campus', type: 'telecom', lat: 39.0438, lng: -77.4874, country: 'US', operator: 'Equinix', riskLevel: 'critical' },
  { id: 'us-faa-atc', name: 'FAA ATC Command Centre', type: 'transport', lat: 38.9450, lng: -77.4580, country: 'US', operator: 'FAA', riskLevel: 'high' },

  // ===== EUROPE =====
  { id: 'de-enbw', name: 'EnBW Grid Operations', type: 'energy', lat: 48.7758, lng: 9.1829, country: 'Germany', operator: 'EnBW', riskLevel: 'high' },
  { id: 'de-frankfurt-ix', name: 'DE-CIX Frankfurt', type: 'telecom', lat: 50.1109, lng: 8.6821, country: 'Germany', operator: 'DE-CIX', riskLevel: 'critical' },
  { id: 'nl-ams-ix', name: 'AMS-IX Amsterdam', type: 'telecom', lat: 52.3676, lng: 4.9041, country: 'Netherlands', operator: 'AMS-IX', riskLevel: 'high' },
  { id: 'fr-edf-nuclear', name: 'EDF Nuclear Fleet Control', type: 'energy', lat: 48.8566, lng: 2.3522, country: 'France', operator: 'EDF', riskLevel: 'critical' },
  { id: 'ua-ukrenergo', name: 'Ukrenergo Grid Control', type: 'energy', lat: 50.4501, lng: 30.5234, country: 'Ukraine', operator: 'Ukrenergo', riskLevel: 'critical' },
  { id: 'no-ekofisk', name: 'Ekofisk Oil Platform SCADA', type: 'energy', lat: 56.5440, lng: 3.2112, country: 'Norway', operator: 'ConocoPhillips', riskLevel: 'high' },

  // ===== MIDDLE EAST =====
  { id: 'sa-aramco', name: 'Saudi Aramco Abqaiq', type: 'energy', lat: 25.9396, lng: 49.6802, country: 'Saudi Arabia', operator: 'Saudi Aramco', riskLevel: 'critical' },
  { id: 'ae-desalination', name: 'Jebel Ali Desalination', type: 'water', lat: 24.9857, lng: 55.0272, country: 'UAE', operator: 'DEWA', riskLevel: 'high' },
  { id: 'il-electric-corp', name: 'Israel Electric Corporation', type: 'energy', lat: 32.0853, lng: 34.7818, country: 'Israel', operator: 'IEC', riskLevel: 'critical' },

  // ===== ASIA-PACIFIC =====
  { id: 'jp-tepco', name: 'TEPCO Grid Control', type: 'energy', lat: 35.6762, lng: 139.6503, country: 'Japan', operator: 'TEPCO', riskLevel: 'high' },
  { id: 'kr-korail', name: 'KORAIL Network Control', type: 'transport', lat: 36.3504, lng: 127.3845, country: 'South Korea', operator: 'KORAIL', riskLevel: 'high' },
  { id: 'tw-tsmc-fabs', name: 'TSMC Fab Operations', type: 'telecom', lat: 24.7736, lng: 120.9816, country: 'Taiwan', operator: 'TSMC', riskLevel: 'critical' },
  { id: 'au-npc', name: 'National Power Centre', type: 'energy', lat: -33.8688, lng: 151.2093, country: 'Australia', operator: 'AEMO', riskLevel: 'medium' },
  { id: 'in-powergrid', name: 'POWERGRID NLDC', type: 'energy', lat: 28.6139, lng: 77.2090, country: 'India', operator: 'POSOCO', riskLevel: 'high' },
  { id: 'sg-equinix-sg', name: 'Equinix Singapore Hub', type: 'telecom', lat: 1.3521, lng: 103.8198, country: 'Singapore', operator: 'Equinix', riskLevel: 'high' },
];
