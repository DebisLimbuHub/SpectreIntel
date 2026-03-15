export default async function handler(req, res) {
  const showId = req.query.showId;
  if (!showId || typeof showId !== 'string' || !/^[a-zA-Z0-9]{22}$/.test(showId)) {
    return res.status(400).json({ error: 'Invalid showId' });
  }

  try {
    const url = `https://open.spotify.com/show/${showId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Spotify returned ${response.status}`);
    }

    const html = await response.text();
    const episodes = [];

    // Method 1: __NEXT_DATA__ embedded JSON
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const jsonData = JSON.parse(nextDataMatch[1]);
        const entity = jsonData?.props?.pageProps?.state?.data?.entity;
        if (entity) {
          const items = entity.episodeV2?.items || entity.episodes?.items || [];
          for (const item of items.slice(0, 20)) {
            const ep = item?.entity?.data || item?.data || item;
            if (!ep) continue;
            const id = ep.uri?.split(':').pop() || ep.id || '';
            episodes.push({
              id,
              title: ep.name || ep.title || 'Untitled',
              description: (ep.description || ep.htmlDescription || '')
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 200),
              publishedAt: ep.releaseDate?.isoString || ep.releaseDate || ep.publishDate || '',
              durationMs: ep.duration?.totalMilliseconds || ep.durationMs || 0,
              thumbnailUrl: ep.coverArt?.sources?.[0]?.url || '',
              externalUrl: id ? `https://open.spotify.com/episode/${id}` : `https://open.spotify.com/show/${showId}`,
            });
          }
        }
      } catch (parseErr) {
        console.error('[Spotify] __NEXT_DATA__ parse error:', parseErr.message);
      }
    }

    // Method 2: regex fallback
    if (episodes.length === 0) {
      const episodeRegex = /"name":"([^"]+)"[^}]*?"releaseDate":\{"isoString":"([^"]+)"[^}]*?"totalMilliseconds":(\d+)/g;
      let match;
      let count = 0;
      while ((match = episodeRegex.exec(html)) !== null && count < 10) {
        episodes.push({
          id: `ep-${count}`,
          title: match[1],
          description: '',
          publishedAt: match[2],
          durationMs: parseInt(match[3], 10),
          thumbnailUrl: '',
          externalUrl: `https://open.spotify.com/show/${showId}`,
        });
        count++;
      }
    }

    // Sort newest first
    episodes.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    res.json({ ok: true, showId, episodeCount: episodes.length, episodes: episodes.slice(0, 10) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Spotify] Episode fetch failed for ${showId}:`, message);
    res.status(502).json({ error: message, episodes: [] });
  }
}
