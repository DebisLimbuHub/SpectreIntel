import { useEffect, useState, useCallback } from 'react';
import type { CyberStock } from '@/types';

/**
 * Cyber Stocks Panel — Cybersecurity sector stock tracker.
 * Fetches live quotes from Yahoo Finance through the Express proxy.
 * Refreshes every 5 minutes during market hours.
 */

const CYBER_TICKERS = [
  { symbol: 'CRWD', name: 'CrowdStrike', sector: 'Endpoint' },
  { symbol: 'PANW', name: 'Palo Alto', sector: 'Network' },
  { symbol: 'FTNT', name: 'Fortinet', sector: 'Network' },
  { symbol: 'ZS', name: 'Zscaler', sector: 'Zero Trust' },
  { symbol: 'S', name: 'SentinelOne', sector: 'Endpoint' },
  { symbol: 'CYBR', name: 'CyberArk', sector: 'Identity' },
  { symbol: 'NET', name: 'Cloudflare', sector: 'Web Security' },
  { symbol: 'OKTA', name: 'Okta', sector: 'Identity' },
  { symbol: 'QLYS', name: 'Qualys', sector: 'Vuln Mgmt' },
  { symbol: 'TENB', name: 'Tenable', sector: 'Vuln Mgmt' },
  { symbol: 'RPD', name: 'Rapid7', sector: 'Detection' },
  { symbol: 'VRNS', name: 'Varonis', sector: 'Data Sec' },
];

interface QuoteData {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  loaded: boolean;
}

export function CyberStocksPanel() {
  const [quotes, setQuotes] = useState<QuoteData[]>(
    CYBER_TICKERS.map((t) => ({ ...t, price: 0, change: 0, changePercent: 0, loaded: false }))
  );
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      const symbols = CYBER_TICKERS.map((t) => t.symbol).join(',');
      const response = await fetch(`/api/stocks?symbols=${symbols}`);

      if (!response.ok) {
        throw new Error(`Stock API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.quotes && Array.isArray(data.quotes)) {
        setQuotes((prev) =>
          prev.map((q) => {
            const match = data.quotes.find((d: { symbol: string }) => d.symbol === q.symbol);
            if (match) {
              return {
                ...q,
                price: match.price || 0,
                change: match.change || 0,
                changePercent: match.changePercent || 0,
                loaded: true,
              };
            }
            return q;
          })
        );
        setLastUpdate(new Date().toLocaleTimeString());
        setError(null);
      }
    } catch (err) {
      console.error('[Stocks] Fetch failed:', err);
      setError('Market data unavailable');
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    const timer = setInterval(fetchQuotes, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchQuotes]);

  // Sector summary
  const loaded = quotes.filter((q) => q.loaded);
  const gainers = loaded.filter((q) => q.change > 0).length;
  const losers = loaded.filter((q) => q.change < 0).length;

  return (
    <div className="hud-panel h-full flex flex-col overflow-hidden">
      <div className="hud-panel-header flex-shrink-0">
        <span className="hud-panel-title">📈 CYBER STOCKS</span>
        <div className="flex items-center gap-1.5">
          {loaded.length > 0 && (
            <>
              <span className="text-[8px] font-mono text-threat-safe">{gainers}▲</span>
              <span className="text-[8px] font-mono text-threat-critical">{losers}▼</span>
            </>
          )}
          {lastUpdate && (
            <span className="text-[8px] font-mono text-gray-600">{lastUpdate}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && loaded.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-gray-600 text-[10px] font-mono">{error}</span>
            <p className="text-gray-700 text-[8px] font-mono mt-1">
              Retrying every 5 minutes
            </p>
          </div>
        ) : (
          <div className="p-1">
            {/* Column headers */}
            <div className="flex items-center px-1.5 py-0.5 text-[7px] font-mono text-gray-600 uppercase tracking-wider">
              <span className="flex-1">Ticker</span>
              <span className="w-16 text-right">Price</span>
              <span className="w-16 text-right">Change</span>
            </div>

            {/* Stock rows */}
            {quotes.map((q) => (
              <StockRow key={q.symbol} quote={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StockRow({ quote }: { quote: QuoteData }) {
  const isPositive = quote.change > 0;
  const isNegative = quote.change < 0;
  const colour = isPositive ? '#00e676' : isNegative ? '#ff1744' : '#9e9e9e';
  const arrow = isPositive ? '▲' : isNegative ? '▼' : '';

  return (
    <div className="flex items-center px-1.5 py-1 rounded-sm hover:bg-cyber-hover/50 transition-colors">
      {/* Ticker + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-semibold text-gray-300">{quote.symbol}</span>
          <span className="text-[8px] font-mono text-gray-600">{quote.sector}</span>
        </div>
        <span className="text-[8px] font-mono text-gray-500">{quote.name}</span>
      </div>

      {/* Price */}
      <div className="w-16 text-right">
        {quote.loaded ? (
          <span className="text-[10px] font-mono text-gray-300">
            ${quote.price.toFixed(2)}
          </span>
        ) : (
          <span className="text-[9px] font-mono text-gray-600">—</span>
        )}
      </div>

      {/* Change */}
      <div className="w-16 text-right">
        {quote.loaded ? (
          <div>
            <span className="text-[9px] font-mono" style={{ color: colour }}>
              {arrow} {Math.abs(quote.changePercent).toFixed(2)}%
            </span>
          </div>
        ) : (
          <span className="text-[9px] font-mono text-gray-600">—</span>
        )}
      </div>
    </div>
  );
}
