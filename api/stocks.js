export default async function handler(req, res) {
  const symbols = req.query.symbols;
  if (!symbols) {
    return res.status(400).json({ error: 'Missing ?symbols= parameter', quotes: [] });
  }

  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9.^=-]{1,10}$/.test(s)).slice(0, 20);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolList[0]}?interval=1d&range=2d`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta) {
        return res.json({
          ok: true,
          quotes: [{ symbol: meta.symbol, price: meta.regularMarketPrice, change: meta.regularMarketPrice - meta.previousClose, changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 }],
          simulated: false,
        });
      }
    }
  } catch {}

  const BASE_PRICES = { CRWD: 345, PANW: 188, FTNT: 98, ZS: 215, S: 24, CYBR: 315, NET: 118, OKTA: 102, QLYS: 142, TENB: 41, RPD: 37, VRNS: 46 };
  const quotes = symbolList.map(sym => {
    const base = BASE_PRICES[sym] || 100;
    const change = (Math.random() - 0.48) * base * 0.04;
    return { symbol: sym, price: base + change, change, changePercent: (change / base) * 100 };
  });
  res.json({ ok: true, quotes, simulated: true });
}
