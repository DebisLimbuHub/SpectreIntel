import { useEffect, useMemo, useState } from 'react';
import type { LiveChannel } from '@/types';
import { LIVE_CHANNELS } from '@/config/liveChannels';
import { useCyberStore } from '@/store';
import { useYoutubeLiveUrls } from '@/hooks/useYoutubeLiveUrls';
import type { LiveUrlEntry } from '@/hooks/useYoutubeLiveUrls';

interface LiveChannelsPanelProps {
  searchQuery?: string;
  showSearchInput?: boolean;
}

function LiveStatusBadge({ entry }: { entry: LiveUrlEntry | undefined }) {
  if (entry === undefined) return null;
  if (entry.isLive) {
    return (
      <span className="text-[7px] font-mono text-threat-critical bg-threat-critical/10 border border-threat-critical/30 px-1 py-0.5 rounded-sm flex-shrink-0">
        LIVE
      </span>
    );
  }
  if (entry.embedUrl) {
    return (
      <span className="text-[7px] font-mono text-gray-500 bg-cyber-card border border-cyber-border px-1 py-0.5 rounded-sm flex-shrink-0">
        REPLAY
      </span>
    );
  }
  return (
    <span className="text-[7px] font-mono text-gray-600 bg-cyber-card border border-cyber-border px-1 py-0.5 rounded-sm flex-shrink-0">
      OFFLINE
    </span>
  );
}

function ChannelRow({
  channel,
  active,
  onSelect,
  liveEntry,
}: {
  channel: LiveChannel;
  active: boolean;
  onSelect: () => void;
  liveEntry: LiveUrlEntry | undefined;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-1.5 rounded-sm border px-2 py-1 transition-colors ${
        active
          ? 'border-accent-cyan/50 bg-accent-cyan/10'
          : 'border-cyber-border bg-cyber-card/50 hover:bg-cyber-hover'
      }`}
    >
      <span
        className={`text-[10px] font-mono truncate flex-1 ${active ? 'text-accent-cyan' : 'text-gray-200'}`}
      >
        {channel.name}
      </span>
      <span
        className={`text-[7px] font-mono uppercase tracking-wider px-1 py-0.5 rounded-sm border flex-shrink-0 ${
          active
            ? 'text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10'
            : 'text-gray-600 border-cyber-border'
        }`}
      >
        {channel.category}
      </span>
      <LiveStatusBadge entry={liveEntry} />
    </button>
  );
}

const COLLAPSED_COUNT = 4;

export function LiveChannelsPanel({
  searchQuery,
  showSearchInput = false,
}: LiveChannelsPanelProps) {
  const liveChannels = useCyberStore((state) => state.liveChannels);
  const selectedChannelId = useCyberStore((state) => state.selectedChannelId);
  const channelSearch = useCyberStore((state) => state.channelSearch);
  const setChannelSearch = useCyberStore((state) => state.setChannelSearch);
  const setLiveChannels = useCyberStore((state) => state.setLiveChannels);
  const selectChannel = useCyberStore((state) => state.selectChannel);
  const [categoryFilter, setCategoryFilter] = useState<LiveChannel['category'] | 'all'>('all');
  const [showAll, setShowAll] = useState(false);

  const liveUrls = useYoutubeLiveUrls();

  useEffect(() => {
    setLiveChannels(LIVE_CHANNELS);
  }, [setLiveChannels]);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setChannelSearch(searchQuery);
    }
  }, [searchQuery, setChannelSearch]);

  const categories = useMemo<(LiveChannel['category'] | 'all')[]>(
    () => ['all', ...new Set(liveChannels.map((channel) => channel.category))],
    [liveChannels],
  );

  const effectiveSearch = searchQuery ?? channelSearch;

  const filteredChannels = useMemo(() => {
    const query = effectiveSearch.trim().toLowerCase();
    return liveChannels.filter((channel) => {
      const matchesCategory = categoryFilter === 'all' || channel.category === categoryFilter;
      const haystack = [
        channel.name,
        channel.region,
        channel.category,
        channel.description ?? '',
        ...(channel.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
  }, [categoryFilter, effectiveSearch, liveChannels]);

  const selectedChannel = useMemo(
    () =>
      filteredChannels.find((channel) => channel.id === selectedChannelId) ??
      filteredChannels[0] ??
      null,
    [filteredChannels, selectedChannelId],
  );

  const embedUrl = selectedChannel ? (liveUrls[selectedChannel.id]?.embedUrl ?? null) : null;
  const liveEntry = selectedChannel ? liveUrls[selectedChannel.id] : undefined;

  useEffect(() => {
    if (filteredChannels.length === 0) return;
    if (!selectedChannel) {
      selectChannel(filteredChannels[0].id);
    }
  }, [filteredChannels, selectChannel, selectedChannel]);

  const visibleChannels = showAll ? filteredChannels : filteredChannels.slice(0, COLLAPSED_COUNT);
  const hiddenCount = filteredChannels.length - COLLAPSED_COUNT;

  return (
    // overflow: visible so the video can never be clipped by this container.
    // minHeight instead of height so the panel grows to fit all content.
    <div
      className="hud-panel flex flex-col"
      style={{ height: '450px', flexShrink: 0, overflow: 'visible' }}
    >
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">📺 Live Channels</span>
        <span className="text-[8px] font-mono uppercase tracking-wider text-gray-600">
          {filteredChannels.length} feeds
        </span>
      </div>

      {/* Channel selector — flex-shrink-0 keeps it from competing with the video */}
      <div className="flex-shrink-0 px-2 pt-1 pb-1 flex flex-col gap-1">
        {showSearchInput && searchQuery === undefined && (
          <label className="relative block">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 text-[10px]">⌕</span>
            <input
              type="text"
              value={channelSearch}
              onChange={(event) => setChannelSearch(event.target.value)}
              placeholder="Search channels..."
              className="w-full bg-cyber-card border border-cyber-border text-gray-300 text-[10px] font-mono pl-6 pr-3 py-1 rounded-sm focus:outline-none focus:border-accent-cyan/50 placeholder-gray-700"
            />
          </label>
        )}

        {/* Compact filter buttons — all on one line */}
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => {
            const active = categoryFilter === category;
            return (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded-sm border transition-colors ${
                  active
                    ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                    : 'border-cyber-border text-gray-500 hover:text-gray-300 hover:bg-cyber-hover'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Compact channel list */}
        {filteredChannels.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {visibleChannels.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                active={channel.id === selectedChannel?.id}
                onSelect={() => selectChannel(channel.id)}
                liveEntry={liveUrls[channel.id]}
              />
            ))}
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-[8px] font-mono text-gray-500 hover:text-accent-cyan transition-colors text-left px-2 py-0.5"
              >
                {showAll ? '▴ Show less' : `▾ +${hiddenCount} more`}
              </button>
            )}
          </div>
        ) : (
          <div className="text-[9px] font-mono text-gray-500 text-center py-1">
            No channels match
          </div>
        )}
      </div>

      {/* Nuclear-proof video container.
          height + minHeight + maxHeight + flexBasis all set to 250px.
          flexShrink:0 + flexGrow:0 prevent any flexbox compression.
          iframe is position:absolute so it ignores internal layout pressure. */}
      {embedUrl ? (
        <div
          style={{
            width: '100%',
            height: '250px',
            minHeight: '250px',
            maxHeight: '250px',
            flexShrink: 0,
            flexGrow: 0,
            flexBasis: '250px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <iframe
            key={`${selectedChannel?.id}-${embedUrl}`}
            src={embedUrl}
            width="100%"
            height="250"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            style={{
              border: 'none',
              display: 'block',
              width: '100%',
              height: '250px',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center border-t border-cyber-border bg-cyber-card/40"
          style={{
            height: '250px',
            minHeight: '250px',
            flexShrink: 0,
            flexGrow: 0,
            flexBasis: '250px',
          }}
        >
          <div className="text-center">
            <span className="text-[9px] font-mono text-gray-500 block mb-1">
              {liveEntry === undefined ? 'Loading stream...' : 'Stream offline'}
            </span>
            {selectedChannel && (
              <span className="text-[8px] font-mono text-gray-600">
                {selectedChannel.name} is not currently live
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
