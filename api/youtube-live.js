const YOUTUBE_CHANNELS = {
  bloomberg: { handle: '@BloombergTelevision', name: 'Bloomberg Television' },
  skynews:   { handle: '@SkyNews',             name: 'Sky News' },
  euronews:  { handle: '@euronews',            name: 'Euronews' },
  dwnews:    { handle: '@DWNews',              name: 'DW News' },
  france24:  { handle: '@FRANCE24English',     name: 'France 24 English' },
  aljazeera: { handle: '@AlJazeeraEnglish',    name: 'Al Jazeera English' },
  cnbc:      { handle: '@CNBCtelevision',      name: 'CNBC' },
};

const FALLBACK_IDS = {
  bloomberg: 'iEpJwprxDdk',
  skynews:   'yRHlsTmIF2M',
  euronews:  'pykpO5kQJ98',
  dwnews:    'LuKwFajn37U',
  cnbc:      '9NyxcX3rhQs',
  france24:  'Ap-UM1O9RBU',
  aljazeera: 'gCNeDWCI0vo',
};

// In-memory cache (per function instance; resets on cold start)
const liveIdCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

async function resolveYoutubeLiveId(channelId) {
  const cached = liveIdCache.get(channelId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.videoId;
  }

  const channel = YOUTUBE_CHANNELS[channelId];
  if (!channel) return null;

  try {
    const url = `https://www.youtube.com/${channel.handle}/live`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;
    const html = await response.text();

    let videoId = null;

    // Method 1: canonical URL
    const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
    if (canonicalMatch) videoId = canonicalMatch[1];

    // Method 2: videoId in JSON data
    if (!videoId) {
      const jsonMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (jsonMatch) videoId = jsonMatch[1];
    }

    // Method 3: embed URL
    if (!videoId) {
      const embedMatch = html.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) videoId = embedMatch[1];
    }

    const isLive = html.includes('"isLive":true') || html.includes('"isLiveNow":true') || html.includes('"liveBroadcastDetails"');

    if (videoId) {
      liveIdCache.set(channelId, { videoId, isLive, timestamp: Date.now() });
      return videoId;
    }

    return null;
  } catch (err) {
    console.error(`[YouTube] Failed to resolve live ID for ${channelId}:`, err.message);
    return null;
  }
}

export default async function handler(req, res) {
  const channelId = req.query.channel;

  if (!channelId) {
    const results = {};
    await Promise.all(
      Object.entries(YOUTUBE_CHANNELS).map(async ([id, info]) => {
        const videoId = (await resolveYoutubeLiveId(id)) || FALLBACK_IDS[id] || null;
        results[id] = {
          name: info.name,
          handle: info.handle,
          videoId,
          embedUrl: videoId
            ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0`
            : null,
          isLive: liveIdCache.get(id)?.isLive || false,
        };
      })
    );
    return res.json({ ok: true, channels: results });
  }

  const videoId = (await resolveYoutubeLiveId(channelId)) || FALLBACK_IDS[channelId] || null;
  if (!videoId) {
    return res.json({ ok: false, error: 'Could not resolve live stream', channel: channelId });
  }

  const info = YOUTUBE_CHANNELS[channelId];
  res.json({
    ok: true,
    channel: channelId,
    name: info?.name,
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0`,
    isLive: liveIdCache.get(channelId)?.isLive || false,
  });
}
