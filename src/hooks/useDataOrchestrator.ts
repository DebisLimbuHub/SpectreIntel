/**
 * useDataOrchestrator — Central data fetching and processing hook.
 *
 * Coordinates:
 *   1. RSS feed fetching (every 5 min)
 *   2. News clustering (Jaccard similarity)
 *   3. CVE data fetching (every 10 min)
 *   4. Signal correlation detection
 *   5. Threat level calculation
 *   6. Alert ticker population
 *
 * Runs on mount and at configured intervals.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCyberStore } from '@/store';
import { fetchAllFeeds } from '@/services/rss-feed';
import { fetchCVEData } from '@/services/cve-service';
import { clusterFeedItems } from '@/services/clustering';
import { runCorrelationEngine } from '@/services/correlation';
import { calculateThreatLevel } from '@/services/threat-level';
import type { AlertTickerItem } from '@/types';

const RSS_INTERVAL = 5 * 60 * 1000;   // 5 minutes
const CVE_INTERVAL = 10 * 60 * 1000;  // 10 minutes

export function useDataOrchestrator() {
  const setClusters = useCyberStore((state) => state.setClusters);
  const setCVEs = useCyberStore((state) => state.setCVEs);
  const setSignals = useCyberStore((state) => state.setSignals);
  const setThreatLevel = useCyberStore((state) => state.setThreatLevel);
  const setAlerts = useCyberStore((state) => state.setAlerts);
  const threatLevel = useCyberStore((state) => state.threatLevel);
  const clusters = useCyberStore((state) => state.clusters);
  const cves = useCyberStore((state) => state.cves);

  const rssTimerRef = useRef<ReturnType<typeof setInterval>>();
  const cveTimerRef = useRef<ReturnType<typeof setInterval>>();
  const isFirstRun = useRef(true);

  // ===== RSS FETCH + CLUSTER =====
  const refreshFeeds = useCallback(async () => {
    try {
      console.log('[Orchestrator] Fetching RSS feeds...');
      const items = await fetchAllFeeds();

      if (items.length > 0) {
        const clustered = clusterFeedItems(items);
        setClusters(clustered);
        console.log(`[Orchestrator] Created ${clustered.length} clusters from ${items.length} items`);

        // Generate alerts from critical items
        const newAlerts: AlertTickerItem[] = clustered
          .filter((c) => c.severity === 'critical' || c.severity === 'high')
          .slice(0, 10)
          .map((c, i) => ({
            id: `alert-${Date.now()}-${i}`,
            text: c.primary.title,
            severity: c.severity,
            icon: c.severity === 'critical' ? '🔴' : '🟠',
            timestamp: new Date(c.primary.publishedAt),
            source: c.primary.source,
            link: c.primary.link,
          }));

        if (newAlerts.length > 0) {
          setAlerts(newAlerts);
        }
      }
    } catch (err) {
      console.error('[Orchestrator] RSS fetch failed:', err);
    }
  }, [setClusters, setAlerts]);

  // ===== CVE FETCH =====
  const refreshCVEs = useCallback(async () => {
    try {
      console.log('[Orchestrator] Fetching CVE data...');
      const cveData = await fetchCVEData();
      if (cveData.length > 0) {
        setCVEs(cveData);
        console.log(`[Orchestrator] Loaded ${cveData.length} CVEs`);
      }
    } catch (err) {
      console.error('[Orchestrator] CVE fetch failed:', err);
    }
  }, [setCVEs]);

  // ===== CORRELATION & THREAT LEVEL =====
  useEffect(() => {
    if (clusters.length === 0) return;

    // Run correlation engine
    const signals = runCorrelationEngine({
      clusters,
      cves,
      ransomwareVictims: [],
      outages: [],
      bgpAnomalies: [],
    });
    setSignals(signals);

    // Calculate threat level
    const criticalClusters = clusters.filter((c) => c.severity === 'critical').length;
    const kevCount = cves.filter((c) => c.isKEV && c.isExploitedInWild).length;
    const velocitySpikes = clusters.filter((c) => c.velocity.level === 'spike').length;

    const newLevel = calculateThreatLevel(
      {
        activeZeroDays: criticalClusters > 0 ? Math.min(criticalClusters, 3) : 0,
        criticalCVEsUnpatched: kevCount,
        activeAPTCampaigns: clusters.filter((c) =>
          c.primary.title.toLowerCase().match(/apt|typhoon|bear|kitten|panda|lazarus|sandworm/),
        ).length,
        ransomwareIncidents24h: clusters.filter((c) =>
          c.primary.title.toLowerCase().includes('ransomware'),
        ).length,
        infrastructureOutages: 0,
        bgpAnomalies: 0,
        velocitySpikes,
        signalConvergences: signals.filter((s) => s.type === 'convergence').length,
      },
      threatLevel?.score,
    );
    setThreatLevel(newLevel);
  }, [clusters, cves]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== INITIAL FETCH + INTERVALS =====
  useEffect(() => {
    if (!isFirstRun.current) return;
    isFirstRun.current = false;

    // Stagger initial fetches to avoid thundering herd
    setTimeout(() => refreshFeeds(), 500);
    setTimeout(() => refreshCVEs(), 1000);

    // Set up refresh intervals
    rssTimerRef.current = setInterval(refreshFeeds, RSS_INTERVAL);
    cveTimerRef.current = setInterval(refreshCVEs, CVE_INTERVAL);

    return () => {
      if (rssTimerRef.current) clearInterval(rssTimerRef.current);
      if (cveTimerRef.current) clearInterval(cveTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
