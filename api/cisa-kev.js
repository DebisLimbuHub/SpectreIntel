export default async function handler(req, res) {
  const urls = [
    'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    'https://raw.githubusercontent.com/cisagov/known-exploited-vulnerabilities/main/known_exploited_vulnerabilities.json',
  ];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SpectreIntel/1.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (err) {
      continue;
    }
  }
  res.status(502).json({ error: 'All CISA KEV sources failed' });
}
