export default async function handler(req, res) {
  const feedUrl = req.query.url;
  if (!feedUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'SpectreIntel/1.0 (OSINT Dashboard)',
        'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Feed returned ${response.status}` });
    }

    const text = await response.text();
    const items = parseRSS(text, feedUrl);
    res.json({ ok: true, url: feedUrl, itemCount: items.length, items });
  } catch (err) {
    res.status(502).json({ error: err.message, url: feedUrl });
  }
}

function parseRSS(xml, sourceUrl) {
  const items = [];
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
  if (items.length === 0) {
    const atomRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((match = atomRegex.exec(xml)) !== null) {
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
  return items.slice(0, 30);
}

function extractTag(block, tag) {
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
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
