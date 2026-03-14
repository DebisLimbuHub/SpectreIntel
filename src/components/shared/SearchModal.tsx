import { useState, useEffect, useRef, useCallback } from 'react';
import { useCyberStore } from '@/store';
import { APT_GROUPS } from '@/config/apt-groups';
import { CRITICAL_INFRASTRUCTURE } from '@/config/infrastructure';
import { sanitiseUrl } from '@/utils/sanitise';

/**
 * Search Modal — Universal search (⌘K / Ctrl+K).
 * Adapted from WorldMonitor's search across all data sources.
 *
 * Searches:
 *   - CVE database (by ID, vendor, keyword)
 *   - APT groups (by name, alias, country)
 *   - News articles (headline text)
 *   - Infrastructure (name, location)
 */

interface SearchResult {
  type: 'cve' | 'apt' | 'news' | 'infra';
  icon: string;
  title: string;
  subtitle: string;
  severity?: string;
  link?: string;
  meta?: string;
}

export function SearchModal() {
  const { searchOpen, setSearchOpen, clusters, cves } = useCyberStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Search logic
  const search = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const lower = q.toLowerCase();
    const found: SearchResult[] = [];

    // Search CVEs
    for (const cve of cves) {
      if (
        cve.id.toLowerCase().includes(lower) ||
        cve.vendor.toLowerCase().includes(lower) ||
        cve.product.toLowerCase().includes(lower) ||
        cve.description.toLowerCase().includes(lower)
      ) {
        found.push({
          type: 'cve',
          icon: '🐛',
          title: cve.id,
          subtitle: `${cve.vendor} — ${cve.product}`,
          severity: cve.severity,
          meta: `CVSS ${cve.cvssScore.toFixed(1)} · ${cve.isKEV ? 'KEV' : ''}`,
        });
      }
      if (found.length >= 30) break;
    }

    // Search APT groups
    for (const apt of APT_GROUPS) {
      const searchText = `${apt.name} ${apt.aliases.join(' ')} ${apt.country} ${apt.sponsor} ${apt.targetSectors.join(' ')}`.toLowerCase();
      if (searchText.includes(lower)) {
        found.push({
          type: 'apt',
          icon: '⚠',
          title: apt.name,
          subtitle: `${apt.country} · ${apt.sponsor}`,
          meta: apt.aliases.slice(0, 2).join(', '),
        });
      }
    }

    // Search news clusters
    for (const cluster of clusters.slice(0, 200)) {
      if (cluster.primary.title.toLowerCase().includes(lower)) {
        found.push({
          type: 'news',
          icon: '📰',
          title: cluster.primary.title.length > 80 ? cluster.primary.title.slice(0, 80) + '…' : cluster.primary.title,
          subtitle: cluster.primary.source,
          severity: cluster.severity,
          link: cluster.primary.link,
          meta: `${cluster.sourceCount} sources`,
        });
      }
      if (found.length >= 30) break;
    }

    // Search infrastructure
    for (const infra of CRITICAL_INFRASTRUCTURE) {
      const searchText = `${infra.name} ${infra.country} ${infra.type} ${infra.operator || ''}`.toLowerCase();
      if (searchText.includes(lower)) {
        found.push({
          type: 'infra',
          icon: infra.type === 'energy' ? '⚡' : infra.type === 'water' ? '💧' : infra.type === 'telecom' ? '📡' : '🏗️',
          title: infra.name,
          subtitle: `${infra.type.toUpperCase()} · ${infra.country}`,
          meta: infra.operator || '',
        });
      }
    }

    setResults(found.slice(0, 15));
    setSelectedIndex(0);
  }, [clusters, cves]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Keyboard navigation
  useEffect(() => {
    if (!searchOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        const result = results[selectedIndex];
        if (result.link) {
          window.open(sanitiseUrl(result.link), '_blank', 'noopener');
        }
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, results, selectedIndex, setSearchOpen]);

  if (!searchOpen) return null;

  const SEVERITY_COLOURS: Record<string, string> = {
    critical: '#ff1744', high: '#ff5722', medium: '#ff9800', low: '#ffc107', info: '#00bcd4',
  };

  const TYPE_LABELS: Record<string, { label: string; colour: string }> = {
    cve: { label: 'CVE', colour: '#ff5722' },
    apt: { label: 'APT', colour: '#ff1744' },
    news: { label: 'NEWS', colour: '#00bcd4' },
    infra: { label: 'INFRA', colour: '#ff9800' },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
        onClick={() => setSearchOpen(false)}
      />

      {/* Modal */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[2001]">
        <div className="bg-cyber-panel border border-cyber-border rounded-md shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(0, 229, 255, 0.1)' }}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-cyber-border">
            <span className="text-gray-500 text-sm">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search CVEs, APT groups, news, infrastructure..."
              className="flex-1 bg-transparent text-sm font-mono text-gray-200 outline-none placeholder-gray-600"
            />
            <kbd className="text-[9px] font-mono text-gray-600 bg-cyber-bg px-1.5 py-0.5 rounded border border-cyber-border">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="p-4 text-center">
                <p className="text-gray-600 text-xs font-mono">Type to search across all data sources</p>
                <div className="flex justify-center gap-3 mt-2">
                  {Object.entries(TYPE_LABELS).map(([key, { label, colour }]) => (
                    <span key={key} className="text-[8px] font-mono px-1.5 py-0.5 rounded-sm"
                      style={{ color: colour, background: `${colour}10`, border: `1px solid ${colour}30` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-600 text-xs font-mono">No results for "{query}"</p>
              </div>
            ) : (
              results.map((result, i) => {
                const typeConf = TYPE_LABELS[result.type];
                const isSelected = i === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.title}-${i}`}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-accent-cyan/10' : 'hover:bg-cyber-hover/50'
                    }`}
                    onClick={() => {
                      if (result.link) window.open(sanitiseUrl(result.link), '_blank', 'noopener');
                      setSearchOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    {/* Icon */}
                    <span className="text-sm mt-0.5 flex-shrink-0">{result.icon}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="text-[7px] font-mono font-bold px-1 py-0.5 rounded-sm flex-shrink-0"
                          style={{ color: typeConf.colour, background: `${typeConf.colour}15`, border: `1px solid ${typeConf.colour}30` }}
                        >
                          {typeConf.label}
                        </span>
                        {result.severity && (
                          <span
                            className="text-[7px] font-mono font-bold px-1 py-0.5 rounded-sm"
                            style={{
                              color: SEVERITY_COLOURS[result.severity] || '#9e9e9e',
                              background: `${SEVERITY_COLOURS[result.severity] || '#9e9e9e'}15`,
                            }}
                          >
                            {result.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-gray-300 leading-tight truncate">
                        {result.title}
                      </p>
                      <p className="text-[9px] font-mono text-gray-600 truncate">
                        {result.subtitle}
                        {result.meta && ` · ${result.meta}`}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    {isSelected && (
                      <span className="text-accent-cyan text-xs mt-1 flex-shrink-0">→</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-cyber-border text-[8px] font-mono text-gray-600">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>ESC Close</span>
            </div>
            <span>{results.length} results</span>
          </div>
        </div>
      </div>
    </>
  );
}
