import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useCyberStore } from '@/store';
import { APT_GROUPS } from '@/config/apt-groups';
import { CRITICAL_INFRASTRUCTURE } from '@/config/infrastructure';
import { ATTACK_ARCS } from '@/config/attack-arcs';
import { UNDERSEA_CABLES } from '@/config/undersea-cables';

/**
 * ThreatMap — Interactive dark-themed world map for Project X.
 *
 * Layers:
 *   - APT Group markers (warning triangles with country colours)
 *   - Attack vector arcs (animated dashed curves origin → target)
 *   - Critical infrastructure pins (energy, water, transport, telecom)
 *   - Undersea cable routes
 *
 * Uses Leaflet.js with CartoDB Dark Matter tiles.
 */

// ===== CUSTOM MARKER ICONS =====

function createAPTIcon(country: string): L.DivIcon {
  const colours: Record<string, string> = {
    Russia: '#E00000',
    China: '#D43A1A',
    'North Korea': '#C46A2A',
    Iran: '#8B0A0A',
  };
  const colour = colours[country] || '#E01515';

  return L.divIcon({
    className: 'apt-marker',
    html: `
      <div style="
        width: 28px; height: 28px;
        display: flex; align-items: center; justify-content: center;
        position: relative;
      ">
        <div style="
          width: 0; height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 18px solid ${colour};
          filter: drop-shadow(0 0 6px ${colour}80);
        "></div>
        <div style="
          position: absolute; top: 8px;
          font-size: 8px; font-weight: bold; color: #050608;
          font-family: 'JetBrains Mono', monospace;
        ">⚠</div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function createInfraIcon(type: string): L.DivIcon {
  const icons: Record<string, { emoji: string; colour: string }> = {
    energy: { emoji: '⚡', colour: '#D43A1A' },
    water: { emoji: '💧', colour: '#8B0A0A' },
    transport: { emoji: '🚆', colour: '#8A8F98' },
    telecom: { emoji: '📡', colour: '#E01515' },
    healthcare: { emoji: '🏥', colour: '#E00000' },
    financial: { emoji: '🏦', colour: '#C46A2A' },
    government: { emoji: '🏛', colour: '#8A8F98' },
  };
  const { emoji, colour } = icons[type] || { emoji: '●', colour: '#E01515' };

  return L.divIcon({
    className: 'infra-marker',
    html: `
      <div style="
        width: 22px; height: 22px;
        background: #0B0D10;
        border: 1.5px solid ${colour};
        border-radius: 3px;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px;
        box-shadow: 0 0 8px ${colour}40;
      ">${emoji}</div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
}

// ===== POPUP HTML GENERATORS =====

function aptPopupHtml(apt: typeof APT_GROUPS[0]): string {
  const sectorTags = apt.targetSectors
    .slice(0, 4)
    .map((s) => `<span style="background:rgba(224,21,21,0.1);border:1px solid rgba(224,21,21,0.2);padding:1px 5px;border-radius:2px;font-size:9px;color:#E01515;">${s}</span>`)
    .join(' ');

  return `
    <div style="font-family:'JetBrains Mono',monospace;min-width:220px;max-width:280px;">
      <div style="font-size:12px;font-weight:600;color:#E01515;margin-bottom:4px;">
        ⚠ ${apt.name}
      </div>
      <div style="font-size:9px;color:#8A8F98;margin-bottom:6px;">
        ${apt.aliases.slice(0, 3).join(' · ')}
      </div>
      <div style="font-size:10px;color:#E8E8E8;margin-bottom:4px;">
        <span style="color:#8A8F98;">Sponsor:</span> ${apt.sponsor}
      </div>
      <div style="font-size:10px;color:#E8E8E8;margin-bottom:4px;">
        <span style="color:#8A8F98;">Origin:</span> ${apt.country}
      </div>
      <div style="font-size:10px;color:#E8E8E8;margin-bottom:4px;">
        <span style="color:#8A8F98;">Active since:</span> ${apt.activeSince}
      </div>
      <div style="font-size:10px;color:#E8E8E8;margin-bottom:6px;">
        <span style="color:#8A8F98;">MITRE:</span>
        <span style="color:#8B0A0A;">${apt.mitreId}</span>
      </div>
      <div style="margin-bottom:6px;">
        <span style="font-size:9px;color:#8A8F98;">Targets:</span><br/>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:3px;">
          ${sectorTags}
        </div>
      </div>
      <div style="font-size:9px;color:#8A8F98;line-height:1.4;border-top:1px solid rgba(224,21,21,0.15);padding-top:6px;">
        ${apt.description}
      </div>
    </div>
  `;
}

function infraPopupHtml(infra: typeof CRITICAL_INFRASTRUCTURE[0]): string {
  const severityColours: Record<string, string> = {
    critical: '#E00000', high: '#E01515', medium: '#D43A1A', low: '#C46A2A', info: '#8A8F98',
  };
  const col = severityColours[infra.riskLevel] || '#8A8F98';

  return `
    <div style="font-family:'JetBrains Mono',monospace;min-width:180px;">
      <div style="font-size:11px;font-weight:600;color:#E8E8E8;margin-bottom:4px;">
        ${infra.name}
      </div>
      <div style="font-size:9px;color:#8A8F98;margin-bottom:3px;">
        ${infra.type.toUpperCase()} · ${infra.country}
      </div>
      ${infra.operator ? `<div style="font-size:9px;color:#8A8F98;">Operator: ${infra.operator}</div>` : ''}
      <div style="font-size:9px;margin-top:4px;">
        <span style="background:${col}20;color:${col};border:1px solid ${col}40;padding:1px 6px;border-radius:2px;">
          ${infra.riskLevel.toUpperCase()}
        </span>
      </div>
    </div>
  `;
}

// ===== CURVED ARC GENERATOR =====

function getArcPoints(
  from: [number, number],
  to: [number, number],
  numPoints = 50,
): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  // Calculate midpoint and offset for curve height
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dist = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  const arcHeight = dist * 0.3; // Curve height proportional to distance

  // Perpendicular offset direction
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpLat = midLat + (-dx / len) * arcHeight;
  const perpLng = midLng + (dy / len) * arcHeight;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bézier: B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    const lat = (1 - t) ** 2 * lat1 + 2 * (1 - t) * t * perpLat + t ** 2 * lat2;
    const lng = (1 - t) ** 2 * lng1 + 2 * (1 - t) * t * perpLng + t ** 2 * lng2;
    points.push([lat, lng]);
  }

  return points;
}

// ===== ZOOM PRESETS =====

interface ZoomPreset {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

const ZOOM_PRESETS: ZoomPreset[] = [
  { name: 'GLOBAL', lat: 25, lng: 20, zoom: 2.5 },
  { name: 'EUROPE', lat: 50, lng: 15, zoom: 4 },
  { name: 'MENA', lat: 28, lng: 45, zoom: 4 },
  { name: 'ASIA-PAC', lat: 25, lng: 110, zoom: 3.5 },
  { name: 'AMERICAS', lat: 25, lng: -90, zoom: 3 },
];

// ===== MAIN MAP COMPONENT =====

export function ThreatMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerGroupsRef = useRef<Record<string, L.LayerGroup>>({});
  const { layers, setMapView } = useCyberStore();
  const [activePreset, setActivePreset] = useState('GLOBAL');

  // Initialise map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [25, 20],
      zoom: 2.5,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
      maxBounds: [[-85, -Infinity], [85, Infinity]],
    });

    // Dark tiles — CartoDB Dark Matter (no labels for cleaner overlay)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19 }
    ).addTo(map);

    // Optional: add labels as a separate layer on top
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19, opacity: 0.25 }
    ).addTo(map);

    // Apply red hue filter to map tiles
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = 'brightness(0.6) saturate(0.5) sepia(0.4) hue-rotate(-30deg) contrast(1.15)';
    }

    // Zoom control — bottom left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Track map movements
    map.on('moveend', () => {
      const c = map.getCenter();
      setMapView({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    });

    mapRef.current = map;

    // Create layer groups
    const groups: Record<string, L.LayerGroup> = {
      'apt-markers': L.layerGroup().addTo(map),
      'active-campaigns': L.layerGroup().addTo(map),
      'critical-infra': L.layerGroup().addTo(map),
      'undersea-cables': L.layerGroup().addTo(map),
      'outages': L.layerGroup(),
      'bgp-anomalies': L.layerGroup(),
      'botnet-c2': L.layerGroup(),
      'ransomware': L.layerGroup(),
      'data-centres': L.layerGroup(),
      'tor-exits': L.layerGroup(),
      'cve-hotspots': L.layerGroup(),
      'phishing': L.layerGroup(),
    };
    layerGroupsRef.current = groups;

    // Populate static layers
    populateHeatGlows(map);
    populateAPTMarkers(groups['apt-markers']);
    populateAttackArcs(groups['active-campaigns']);
    populateInfrastructure(groups['critical-infra']);
    populateCables(groups['undersea-cables']);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync layer visibility with store
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const groups = layerGroupsRef.current;

    for (const layer of layers) {
      const group = groups[layer.id];
      if (!group) continue;

      if (layer.enabled && !map.hasLayer(group)) {
        map.addLayer(group);
      } else if (!layer.enabled && map.hasLayer(group)) {
        map.removeLayer(group);
      }
    }
  }, [layers]);

  // Handle zoom presets
  const flyToPreset = (preset: ZoomPreset) => {
    mapRef.current?.flyTo([preset.lat, preset.lng], preset.zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
    setActivePreset(preset.name);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Zoom Presets — bottom centre */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] flex gap-1">
        {ZOOM_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => flyToPreset(preset)}
            className={`px-2.5 py-1 text-[9px] font-mono tracking-wider rounded-sm transition-all ${
              activePreset === preset.name
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 shadow-glow-cyan'
                : 'bg-cyber-panel/90 text-gray-500 border border-cyber-border hover:text-gray-300 hover:border-cyber-border-active'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Map Stats Overlay — bottom right */}
      <div className="absolute bottom-3 right-16 z-[1000] flex items-center gap-3">
        <MapStat label="APT Groups" count={APT_GROUPS.length} colour="#E00000" />
        <MapStat label="Infrastructure" count={CRITICAL_INFRASTRUCTURE.length} colour="#D43A1A" />
        <MapStat label="Attack Vectors" count={ATTACK_ARCS.length} colour="#D43A1A" />
      </div>

      {/* Grid overlay — use repeating gradients to avoid tiled seam gaps */}
      <div
        className="absolute inset-0 pointer-events-none z-[500]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              to bottom,
              rgba(224, 21, 21, 0.05) 0,
              rgba(224, 21, 21, 0.05) 1px,
              transparent 1px,
              transparent 80px
            ),
            repeating-linear-gradient(
              to right,
              rgba(224, 21, 21, 0.05) 0,
              rgba(224, 21, 21, 0.05) 1px,
              transparent 1px,
              transparent 80px
            ),
            repeating-linear-gradient(
              to bottom,
              rgba(224, 21, 21, 0.025) 0,
              rgba(224, 21, 21, 0.025) 1px,
              transparent 1px,
              transparent 20px
            ),
            repeating-linear-gradient(
              to right,
              rgba(224, 21, 21, 0.025) 0,
              rgba(224, 21, 21, 0.025) 1px,
              transparent 1px,
              transparent 20px
            )
          `,
        }}
      />

      {/* Red radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[500]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 35%, rgba(224, 21, 21, 0.06) 65%, rgba(139, 10, 10, 0.12) 100%)',
        }}
      />

      {/* Film grain / noise texture */}
      <div
        className="absolute inset-0 pointer-events-none z-[550]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Animated grain flicker */}
      <div
        className="absolute inset-0 pointer-events-none z-[551]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' seed='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.02,
          mixBlendMode: 'soft-light',
          animation: 'grain-flicker 0.15s steps(1) infinite',
        }}
      />

      {/* Animated scanline */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-[600] animate-scanline"
        style={{
          height: '2px',
          background: 'linear-gradient(to bottom, transparent, #E01515, transparent)',
          opacity: 0.12,
          boxShadow: '0 0 20px rgba(224, 21, 21, 0.25), 0 0 40px rgba(224, 21, 21, 0.1)',
        }}
      />

      {/* Heavy vignette — corners nearly black */}
      <div
        className="absolute inset-0 pointer-events-none z-[700]"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 25%, rgba(5, 6, 8, 0.3) 55%, rgba(5, 6, 8, 0.7) 80%, rgba(5, 6, 8, 0.95) 100%)
          `,
        }}
      />
    </div>
  );
}

function MapStat({ label, count, colour }: { label: string; count: number; colour: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-cyber-panel/90 border border-cyber-border rounded-sm px-2 py-1">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colour, boxShadow: `0 0 6px ${colour}60` }} />
      <span className="text-[9px] font-mono text-gray-500">{label}</span>
      <span className="text-[10px] font-mono text-gray-300 font-semibold">{count}</span>
    </div>
  );
}

// ===== LAYER POPULATION FUNCTIONS =====

function populateAPTMarkers(group: L.LayerGroup) {
  // Offset overlapping markers (multiple APTs in same city)
  const used: Record<string, number> = {};

  for (const apt of APT_GROUPS) {
    const key = `${apt.lat},${apt.lng}`;
    const offset = (used[key] || 0) * 0.4;
    used[key] = (used[key] || 0) + 1;

    const marker = L.marker([apt.lat + offset, apt.lng + offset * 0.5], {
      icon: createAPTIcon(apt.country),
    });

    marker.bindPopup(aptPopupHtml(apt), {
      className: 'cyber-popup',
      maxWidth: 300,
    });

    group.addLayer(marker);
  }
}

function populateAttackArcs(group: L.LayerGroup) {
  for (const arc of ATTACK_ARCS) {
    const severityColours: Record<string, string> = {
      critical: '#E00000',
      high: '#E01515',
      medium: '#D43A1A',
      low: '#C46A2A',
    };
    const colour = severityColours[arc.severity] || '#E01515';

    const points = getArcPoints(
      [arc.fromLat, arc.fromLng],
      [arc.toLat, arc.toLng],
    );

    // Outer glow line
    const glow = L.polyline(points, {
      color: colour,
      weight: 4,
      opacity: 0.15,
      smoothFactor: 1,
    });

    // Main arc line
    const line = L.polyline(points, {
      color: colour,
      weight: 1.5,
      opacity: 0.7,
      dashArray: '8 4',
      smoothFactor: 1,
    });

    // Arrowhead at destination
    const lastTwo = points.slice(-2);
    const arrow = L.circleMarker(
      [arc.toLat, arc.toLng],
      {
        radius: 4,
        color: colour,
        fillColor: colour,
        fillOpacity: 0.8,
        weight: 1,
      }
    );

    arrow.bindPopup(`
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;">
        <div style="color:#E01515;font-weight:600;margin-bottom:3px;">${arc.label}</div>
        ${arc.aptGroup ? `<div style="color:#8A8F98;font-size:9px;">APT: ${arc.aptGroup}</div>` : ''}
        <div style="color:${colour};font-size:9px;margin-top:2px;">${arc.severity.toUpperCase()}</div>
      </div>
    `, { className: 'cyber-popup' });

    // Origin pulse marker
    const origin = L.circleMarker(
      [arc.fromLat, arc.fromLng],
      {
        radius: 3,
        color: colour,
        fillColor: colour,
        fillOpacity: 0.5,
        weight: 1,
      }
    );

    group.addLayer(glow);
    group.addLayer(line);
    group.addLayer(arrow);
    group.addLayer(origin);
  }
}

function populateInfrastructure(group: L.LayerGroup) {
  for (const infra of CRITICAL_INFRASTRUCTURE) {
    const marker = L.marker([infra.lat, infra.lng], {
      icon: createInfraIcon(infra.type),
    });

    marker.bindPopup(infraPopupHtml(infra), {
      className: 'cyber-popup',
      maxWidth: 250,
    });

    group.addLayer(marker);
  }
}

function populateHeatGlows(map: L.Map) {
  const hotspots = [
    { lat: 33.0, lng: 44.0, radius: 800000, intensity: 0.12 },
    { lat: 28.0, lng: 48.0, radius: 600000, intensity: 0.10 },
    { lat: 49.0, lng: 32.0, radius: 700000, intensity: 0.11 },
    { lat: 50.0, lng: 10.0, radius: 900000, intensity: 0.08 },
    { lat: 35.0, lng: 120.0, radius: 800000, intensity: 0.10 },
    { lat: 37.0, lng: 127.0, radius: 500000, intensity: 0.09 },
    { lat: 56.0, lng: 38.0, radius: 700000, intensity: 0.09 },
    { lat: 33.0, lng: 53.0, radius: 600000, intensity: 0.10 },
    { lat: 5.0,  lng: 40.0, radius: 600000, intensity: 0.07 },
    { lat: 38.0, lng: -77.0, radius: 800000, intensity: 0.08 },
    { lat: 22.0, lng: 78.0, radius: 700000, intensity: 0.06 },
    { lat: 5.0,  lng: 105.0, radius: 600000, intensity: 0.07 },
  ];

  for (const spot of hotspots) {
    L.circle([spot.lat, spot.lng], {
      radius: spot.radius,
      color: 'transparent',
      fillColor: '#E01515',
      fillOpacity: spot.intensity * 0.3,
      interactive: false,
      pane: 'overlayPane',
    }).addTo(map);

    L.circle([spot.lat, spot.lng], {
      radius: spot.radius * 0.6,
      color: 'transparent',
      fillColor: '#E01515',
      fillOpacity: spot.intensity * 0.5,
      interactive: false,
      pane: 'overlayPane',
    }).addTo(map);

    L.circle([spot.lat, spot.lng], {
      radius: spot.radius * 0.25,
      color: 'transparent',
      fillColor: '#FF2020',
      fillOpacity: spot.intensity * 0.7,
      interactive: false,
      pane: 'overlayPane',
    }).addTo(map);
  }
}

function populateCables(group: L.LayerGroup) {
  for (const cable of UNDERSEA_CABLES) {
    if (cable.landingPoints.length < 2) continue;

    const points: [number, number][] = cable.landingPoints.map((p) => [p.lat, p.lng]);

    const line = L.polyline(points, {
      color: 'rgba(224, 21, 21, 0.5)',
      weight: 1,
      opacity: 0.4,
      dashArray: '4 6',
    });

    line.bindPopup(`
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;">
        <div style="color:#E01515;font-weight:600;margin-bottom:3px;">🌐 ${cable.name}</div>
        <div style="color:#8A8F98;font-size:9px;">
          ${cable.landingPoints.map((p) => p.country).join(' → ')}
        </div>
        ${cable.capacityTbps ? `<div style="color:#8A8F98;font-size:9px;margin-top:2px;">Capacity: ${cable.capacityTbps} Tbps</div>` : ''}
      </div>
    `, { className: 'cyber-popup' });

    group.addLayer(line);
  }
}
