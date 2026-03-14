# Cyber Monitor — Local Setup Guide
## Step-by-step walkthrough for VS Code + Node.js

---

## PREREQUISITES CHECKLIST

Before starting, confirm you have these installed:

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Node.js | v18+ | `node --version` |
| npm | v9+ | `npm --version` |
| VS Code | Latest | Already installed |
| Claude AI extension | Latest | Installed in VS Code |
| Git | Any | `git --version` |

---

## STEP 1: CREATE THE PROJECT FOLDER

Open your terminal (or the VS Code integrated terminal with Ctrl+`) and run:

```bash
# Pick where you want the project. Examples:
# Windows: cd C:\Users\YourName\Projects
# Mac/Linux: cd ~/Projects

mkdir cyber-monitor
cd cyber-monitor
```

Open this folder in VS Code:
```bash
code .
```

---

## STEP 2: INITIALISE THE PROJECT

In the VS Code integrated terminal (Ctrl+`):

```bash
# Initialise with the package.json from our scaffold
npm init -y
```

Then replace the contents of `package.json` with:

```json
{
  "name": "cyber-monitor",
  "version": "0.1.0",
  "description": "Critical Infrastructure Cybersecurity OSINT Dashboard",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.13.0",
    "zustand": "^4.5.5",
    "lucide-react": "^0.383.0",
    "date-fns": "^3.6.0",
    "dompurify": "^3.1.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/leaflet": "^1.9.14",
    "@types/dompurify": "^3.0.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

Now install everything:

```bash
npm install
```

This will take 1-2 minutes. You should see a `node_modules` folder appear.

---

## STEP 3: CREATE THE FOLDER STRUCTURE

Run these commands in your terminal to create all the directories:

```bash
# Config files (project root)
# These will be created as files in the next steps

# Source directories
mkdir -p src/components/layout
mkdir -p src/components/map
mkdir -p src/components/panels
mkdir -p src/components/shared
mkdir -p src/config
mkdir -p src/services
mkdir -p src/workers
mkdir -p src/utils
mkdir -p src/hooks
mkdir -p src/styles
mkdir -p src/types

# Other directories
mkdir -p public
mkdir -p assets
mkdir -p research
```

Your VS Code file explorer should now show:

```
cyber-monitor/
├── assets/
├── node_modules/
├── public/
├── research/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── map/
│   │   ├── panels/
│   │   └── shared/
│   ├── config/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   └── workers/
├── package.json
└── package-lock.json
```

---

## STEP 4: CREATE CONFIG FILES (Project Root)

Create each of these files in your project root. In VS Code, right-click
the file explorer → "New File" or use Ctrl+N then Ctrl+S to save.

### 4a. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4b. `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

### 4c. `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.1.0'),
  },
});
```

### 4d. `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-bg': '#0a0e17',
        'cyber-panel': '#0f1420',
        'cyber-card': '#141b2d',
        'cyber-hover': '#1a2238',
        'cyber-border': '#1e2a3a',
        'cyber-border-active': '#2a4a6b',
        'threat-critical': '#ff1744',
        'threat-high': '#ff5722',
        'threat-medium': '#ff9800',
        'threat-low': '#ffc107',
        'threat-info': '#00bcd4',
        'threat-safe': '#4caf50',
        'accent-cyan': '#00e5ff',
        'accent-blue': '#2196f3',
        'accent-orange': '#ff6d00',
        'accent-red': '#ff1744',
        'accent-green': '#00e676',
        'accent-purple': '#7c4dff',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        'threat-pulse': 'threat-pulse 2s ease-in-out infinite',
        'ticker-scroll': 'ticker-scroll 30s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'threat-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(255, 23, 68, 0.5)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px rgba(255, 23, 68, 0.3)' },
        },
        'ticker-scroll': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(-100%)' },
        },
        'glow': {
          from: { boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)' },
          to: { boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
```

### 4e. `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 4f. `index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cyber Monitor — Critical Infrastructure OSINT Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  </head>
  <body class="bg-cyber-bg text-gray-200 font-sans antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 4g. `.gitignore`
```
node_modules
dist
.env
.env.local
*.log
.DS_Store
```

---

## STEP 5: CREATE SOURCE FILES

Now create the source files inside `src/`. There are 14 files to create.
Copy each one exactly from the project scaffold.

### File creation order (each depends on the ones before it):

```
1.  src/types/index.ts          ← Type definitions (everything depends on this)
2.  src/styles/globals.css      ← Tailwind + custom CSS
3.  src/config/feeds.ts         ← RSS feed configuration
4.  src/config/apt-groups.ts    ← APT group data for map markers
5.  src/utils/circuit-breaker.ts ← Fault tolerance pattern
6.  src/utils/sanitise.ts       ← XSS prevention
7.  src/services/clustering.ts  ← Jaccard similarity clustering
8.  src/services/correlation.ts ← Signal detection engine
9.  src/services/threat-level.ts ← Composite threat score
10. src/store.ts                ← Zustand state management
11. src/components/layout/Header.tsx      ← Top header bar
12. src/components/layout/AlertTicker.tsx ← Bottom scrolling alerts
13. src/App.tsx                 ← Main app component
14. src/main.tsx                ← Entry point
```

The contents of each file are in the project download from this chat.
Copy them in the order above.

---

## STEP 6: COPY THE RESEARCH FILES

Copy the 4 research documents into your `research/` folder:

```
research/WORLDMONITOR_ANALYSIS.md
research/DATA_SOURCES.md
research/DESIGN_SYSTEM.md
research/FEATURE_MAPPING.md
```

Also copy `OSINT_Concept_Art.png` into `assets/`.

These are your reference blueprints. They contain every design decision,
data source, algorithm, and feature specification.

---

## STEP 7: FIRST RUN

In your VS Code terminal:

```bash
npm run dev
```

You should see output like:

```
  VITE v5.4.11  ready in 400ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h + enter to show help
```

Open http://localhost:5173 in your browser.

### What you should see:
- Dark background (#0a0e17)
- Header bar with "CYBER MONITOR v0.1.0", threat level badge, signal counter
- Left sidebar with placeholder panels (Threat Intel Feed, Active Threats, Attack Origins)
- Centre area with "MAP LOADING" placeholder
- Right sidebar with placeholder panels (Threat Level, Infra Risk, CVE Feed, etc.)
- Bottom scrolling alert ticker with demo data
- Layer toggle panel (top-right)
- Time filter buttons (top-left)

If you see this — congratulations, the foundation is working.

---

## STEP 8: VERIFY EVERYTHING WORKS

### Quick checks:
1. ✅ Page loads with dark theme
2. ✅ Header shows version number
3. ✅ Alert ticker scrolls at bottom
4. ✅ Layer checkboxes toggle on/off
5. ✅ Time filter buttons highlight when clicked
6. ✅ ⌘K / Ctrl+K doesn't do anything visible yet (search not built)
7. ✅ No red errors in browser console (F12 → Console tab)

### If something goes wrong:

**"Cannot find module '@/types'"**
→ The `@/` path alias isn't resolving. Check your `tsconfig.json` has
  the `paths` config and `vite.config.ts` has the `resolve.alias`.

**Styles look wrong / no dark theme**
→ Check `src/styles/globals.css` has the `@tailwind` directives at the top
  and `tailwind.config.js` references the right content paths.

**Blank white page**
→ Open browser console (F12). Look for errors. Most likely a missing
  import or typo in a filename.

---

## STEP 9: INITIALISE GIT

```bash
git init
git add .
git commit -m "Initial scaffold: Cyber Monitor OSINT Dashboard"
```

This gives you a save point to roll back to if anything breaks.

---

## WHAT HAPPENS NEXT

The scaffold gives you the **skeleton**. The panels show "Awaiting data feed"
because we haven't built the live components yet. Here's what we build next,
in order:

### Phase 1 — The Map (next session)
- Leaflet.js dark map replacing the placeholder
- APT group markers from the config data
- Attack vector arc lines
- Critical infrastructure pins
- Zoom presets (Global, Europe, MENA, Asia-Pacific)

### Phase 2 — Live Data Feeds
- RSS feed service with circuit breakers
- News clustering (Jaccard similarity)
- Threat Intel Feed panel (replacing placeholder)
- CVE Feed panel with NVD/CISA data

### Phase 3 — Intelligence Engine
- Signal correlation detection
- Velocity analysis
- Threat level gauge (the semicircular gauge from the concept art)
- Infrastructure risk panel

### Phase 4 — Advanced Features
- Ransomware tracker
- Internet outage layer (Cloudflare Radar)
- Botnet C2 markers
- Cyber stock ticker
- Search modal (⌘K)

### Phase 5 — Polish
- Activity tracking (NEW badges)
- Custom keyword monitors
- Data export
- Shareable URL state
- Performance optimisation

Come back to this chat after Step 8 and tell me what you see.
We'll build Phase 1 together.

---

## QUICK REFERENCE

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Check TypeScript errors |
| `Ctrl+C` | Stop the dev server |
| `Ctrl+\`` | Toggle VS Code terminal |
| `⌘K` / `Ctrl+K` | Search (once built) |
