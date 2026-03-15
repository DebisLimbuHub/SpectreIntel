import type { LiveChannel, LiveChannelSource } from '@/types';
import { sanitiseUrl } from '@/utils/sanitise';

export function isYouTubeSource(source: LiveChannelSource): boolean {
  return (
    source.provider === 'youtube-video' ||
    source.provider === 'youtube-playlist' ||
    source.provider === 'youtube-user-uploads'
  );
}

export function getSortedSources(channel: Pick<LiveChannel, 'sources'>): LiveChannelSource[] {
  return [...channel.sources].sort((a, b) => a.priority - b.priority);
}

export function getBestInitialSource(channel: Pick<LiveChannel, 'sources'>): LiveChannelSource | null {
  return getSortedSources(channel)[0] ?? null;
}

export function buildYouTubeEmbedUrl(source: LiveChannelSource): string {
  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    rel: '0',
  });

  if (source.provider === 'youtube-video') {
    if (!source.videoId) return '';
    return `https://www.youtube.com/embed/${source.videoId}?${params.toString()}`;
  }

  if (source.provider === 'youtube-playlist') {
    if (!source.playlistId) return '';
    params.set('list', source.playlistId);
    return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
  }

  // youtube-user-uploads
  if (!source.uploadsUser) return '';
  params.set('listType', 'user_uploads');
  params.set('list', source.uploadsUser);
  return `https://www.youtube.com/embed?${params.toString()}`;
}

export function buildEmbedUrl(source: LiveChannelSource): string | null {
  if (isYouTubeSource(source)) {
    const url = buildYouTubeEmbedUrl(source);
    return url || null;
  }

  if (source.provider === 'direct-iframe') {
    const url = source.embedUrl ? sanitiseUrl(source.embedUrl) : '';
    return url || null;
  }

  return null;
}

export function getChannelWebsiteUrl(channel: LiveChannel, source?: LiveChannelSource | null): string | null {
  const rawUrl =
    source?.websiteUrl ??
    getSortedSources(channel).find((candidate) => candidate.websiteUrl)?.websiteUrl ??
    '';

  const url = rawUrl ? sanitiseUrl(rawUrl) : '';
  return url || null;
}
