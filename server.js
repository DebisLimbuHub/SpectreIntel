/**
 * Project X — API Proxy Server
 *
 * Lightweight Express server that proxies external API calls
 * to bypass browser CORS restrictions.
 *
 * Endpoints:
 *   GET /api/rss?url=<encoded_rss_url>  → Fetches and parses RSS/Atom feeds
 *   GET /api/cisa-kev                    → CISA Known Exploited Vulnerabilities
 *   GET /api/nvd?keyword=<term>          → NVD CVE search
 *
 * Runs on port 3001 alongside Vite dev server (port 5173).
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ===== RSS FEED PROXY =====

app.get('/api/rss', async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl || typeof feedUrl !== 'string') {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  // Validate URL
  try {
    const parsed = new URL(feedUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'ProjectX-CyberMonitor/0.1 (OSINT Dashboard)',
        'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Feed returned ${response.status}`,
        url: feedUrl,
      });
    }

    const text = await response.text();
    const items = parseRSS(text, feedUrl);

    res.json({
      ok: true,
      url: feedUrl,
      itemCount: items.length,
      items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[RSS] Failed to fetch ${feedUrl}: ${message}`);
    res.status(502).json({ error: message, url: feedUrl });
  }
});

// ===== CISA KEV ENDPOINT =====

app.get('/api/cisa-kev', async (_req, res) => {
  try {
    const response = await fetch(
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      { signal: AbortSignal.timeout(15_000) }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: `CISA returned ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[CISA-KEV] Failed: ${message}`);
    res.status(502).json({ error: message });
  }
});

// ===== NVD CVE SEARCH =====

app.get('/api/nvd', async (req, res) => {
  const keyword = req.query.keyword || '';
  const resultsPerPage = Math.min(Number(req.query.limit) || 20, 50);

  try {
    const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0');
    if (keyword) url.searchParams.set('keywordSearch', String(keyword));
    url.searchParams.set('resultsPerPage', String(resultsPerPage));

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'ProjectX-CyberMonitor/0.1' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `NVD returned ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[NVD] Failed: ${message}`);
    res.status(502).json({ error: message });
  }
});

// ===== STOCK QUOTES (Yahoo Finance) =====

app.get('/api/stocks', async (req, res) => {
  const symbols = req.query.symbols;
  if (!symbols || typeof symbols !== 'string') {
    return res.status(400).json({ error: 'Missing ?symbols= parameter' });
  }

  // Validate symbols
  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9.^=-]{1,10}$/.test(s)).slice(0, 20);
  if (symbolList.length === 0) {
    return res.status(400).json({ error: 'No valid symbols provided' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolList.join(',')}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status}`);
    }

    const data = await response.json();
    const results = data?.quoteResponse?.result || [];

    const quotes = results.map(q => ({
      symbol: q.symbol,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      marketCap: q.marketCap || 0,
      volume: q.regularMarketVolume || 0,
    }));

    res.json({ ok: true, quotes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stocks] Failed: ${message}`);
    res.status(502).json({ error: message, quotes: [] });
  }
});

// ===== HEALTH CHECK =====

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ProjectX API Proxy', uptime: process.uptime() });
});

// ===== RSS PARSER =====

function parseRSS(xml, sourceUrl) {
  const items = [];

  // Try RSS 2.0 <item> format
  const rssItemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = rssItemRegex.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      title: extractTag(block, 'title'),
      link: extractTag(block, 'link') || extractAtomLink(block),
      description: stripHtml(extractTag(block, 'description') || extractTag(block, 'summary') || ''),
      pubDate: extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated') || '',
      source: sourceUrl,
    });
  }

  // If no RSS items found, try Atom <entry> format
  if (items.length === 0) {
    const atomEntryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((match = atomEntryRegex.exec(xml)) !== null) {
      const block = match[1];
      items.push({
        title: extractTag(block, 'title'),
        link: extractAtomLink(block) || extractTag(block, 'link'),
        description: stripHtml(extractTag(block, 'summary') || extractTag(block, 'content') || ''),
        pubDate: extractTag(block, 'published') || extractTag(block, 'updated') || '',
        source: sourceUrl,
      });
    }
  }

  return items.slice(0, 30); // Cap at 30 items per feed
}

function extractTag(block, tag) {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle normal: <tag>content</tag>
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(regex);
  return m ? m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
}

function extractAtomLink(block) {
  const m = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return m ? m[1] : '';
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
}

// ===== START =====

app.listen(PORT, () => {
  console.log(`\n  ⚡ Project X API Proxy running on http://localhost:${PORT}`);
  console.log(`  📡 RSS proxy:  /api/rss?url=<feed_url>`);
  console.log(`  🐛 CISA KEV:   /api/cisa-kev`);
  console.log(`  🔍 NVD search: /api/nvd?keyword=<term>`);
  console.log(`  📈 Stocks:     /api/stocks?symbols=CRWD,PANW,...\n`);
});
