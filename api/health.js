export default async function handler(req, res) {
  res.json({
    status: 'ok',
    service: 'Spectre Intel API (Vercel Serverless)',
    timestamp: new Date().toISOString()
  });
}
