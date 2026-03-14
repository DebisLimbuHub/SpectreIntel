# Cyber Monitor — Design System Reference

## Colour Palette (from Concept Art Analysis)

### Base Colours
```css
:root {
  /* Background layers */
  --bg-primary: #0a0e17;      /* Deep navy-black */
  --bg-secondary: #0f1420;    /* Panel background */
  --bg-tertiary: #141b2d;     /* Card/container background */
  --bg-hover: #1a2238;        /* Hover state */

  /* Border & Glow */
  --border-default: #1e2a3a;  /* Subtle borders */
  --border-accent: #2a4a6b;   /* Active borders */
  --border-glow: rgba(0, 180, 255, 0.3); /* Cyan glow */

  /* Threat Level Colours */
  --critical: #ff1744;        /* Critical — bright red */
  --high: #ff5722;            /* High — orange-red */
  --medium: #ff9800;          /* Medium — amber */
  --low: #ffc107;             /* Low — yellow */
  --info: #00bcd4;            /* Informational — cyan */
  --safe: #4caf50;            /* Safe — green */

  /* Accent Colours */
  --accent-cyan: #00e5ff;     /* Primary accent */
  --accent-blue: #2196f3;     /* Secondary accent */
  --accent-orange: #ff6d00;   /* Attack vectors */
  --accent-red: #ff1744;      /* Active threats */
  --accent-green: #00e676;    /* Safe/resolved */
  --accent-purple: #7c4dff;   /* APT markers */

  /* Text */
  --text-primary: #e0e0e0;    /* Main text */
  --text-secondary: #9e9e9e;  /* Muted text */
  --text-accent: #00e5ff;     /* Highlighted text */
  --text-critical: #ff1744;   /* Critical text */

  /* Glow Effects */
  --glow-red: 0 0 10px rgba(255, 23, 68, 0.5);
  --glow-cyan: 0 0 10px rgba(0, 229, 255, 0.5);
  --glow-orange: 0 0 10px rgba(255, 109, 0, 0.5);
  --glow-pulse: 0 0 20px rgba(255, 23, 68, 0.3);
}
```

### Typography
```css
:root {
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  --font-sans: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-display: 'Orbitron', 'Rajdhani', sans-serif; /* HUD headers */

  --text-xs: 0.625rem;   /* 10px — timestamps, labels */
  --text-sm: 0.75rem;    /* 12px — secondary info */
  --text-base: 0.875rem; /* 14px — body text */
  --text-lg: 1rem;       /* 16px — panel headers */
  --text-xl: 1.25rem;    /* 20px — section titles */
  --text-2xl: 1.5rem;    /* 24px — main header */
  --text-3xl: 2rem;      /* 32px — hero numbers */
}
```

### Component Patterns

#### HUD Panel Container
```css
.hud-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 12px;
  position: relative;
  overflow: hidden;
}

.hud-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--accent-cyan),
    transparent
  );
}
```

#### Threat Level Badge
```css
.threat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.threat-badge.critical {
  background: rgba(255, 23, 68, 0.15);
  color: var(--critical);
  border: 1px solid rgba(255, 23, 68, 0.3);
}
```

#### Animated Pulse (Active Threat)
```css
@keyframes threat-pulse {
  0%, 100% { opacity: 1; box-shadow: var(--glow-red); }
  50% { opacity: 0.7; box-shadow: var(--glow-pulse); }
}

.active-threat {
  animation: threat-pulse 2s ease-in-out infinite;
}
```

#### Attack Vector Arc (Map)
```css
.attack-arc {
  stroke: var(--accent-orange);
  stroke-width: 1.5;
  fill: none;
  opacity: 0.7;
  stroke-dasharray: 8 4;
  animation: arc-flow 2s linear infinite;
}

@keyframes arc-flow {
  to { stroke-dashoffset: -12; }
}
```

#### Scrolling Alert Ticker
```css
.alert-ticker {
  overflow: hidden;
  white-space: nowrap;
  background: rgba(255, 23, 68, 0.05);
  border-top: 1px solid rgba(255, 23, 68, 0.2);
  padding: 6px 0;
}

.alert-ticker-content {
  display: inline-block;
  animation: ticker-scroll 30s linear infinite;
}

@keyframes ticker-scroll {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
```

#### Threat Gauge (Semicircular)
- SVG arc gauge from 0-10
- Gradient: green → yellow → orange → red
- Needle animation on value change
- Numeric readout with severity label

#### Infrastructure Risk Bars
- Horizontal bars per sector
- Fill percentage = risk level
- Colour transitions: green → yellow → orange → red
- Animated fill on data refresh

---

## Layout Grid
- **Desktop**: 12-column grid, 1920px max-width
- **Map**: Spans 6-8 columns centre
- **Side panels**: 2-3 columns each side
- **Bottom ticker**: Full width
- **Responsive**: Panels stack vertically on mobile

## Icon System
- Use Lucide React icons as base
- Custom SVG icons for: APT groups, infrastructure sectors, threat types
- Colour-coded by severity
- Animated pulse for active/critical items

## Map Tile Provider
- **Dark tiles**: CartoDB Dark Matter or Mapbox Dark
- **No labels** mode for clean overlay
- **Custom markers**: SVG-based with glow effects
