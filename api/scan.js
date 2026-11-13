export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, message: 'URL enter karna zaroori hai' });

  try {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Target Website ka HTML Fetch Karein
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SEOGlint/1.0 (+https://searchlens-five.vercel.app)'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'Website open nahi ho saki (Status: ' + response.status + ')' });
    }

    const html = await response.text();

    // robots.txt aur llms.txt (validated: HTML soft-404 ko file nahi maana jata)
    const origin = new URL(targetUrl).origin;
    const UA = 'Mozilla/5.0 (compatible; SEOGlint/1.0; +https://searchlens-five.vercel.app)';
    const getFile = async (path) => {
      try {
        const r = await fetch(origin + path, {
          headers: { 'User-Agent': UA, 'Accept': 'text/plain,*/*;q=0.5' },
          redirect: 'follow',
          signal: AbortSignal.timeout(8000)
        });
        if (r.status >= 500) return { text: '', status: 'unreachable' };
        if (!r.ok) return { text: '', status: 'missing' };
        const text = await r.text();
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        const looksHtml = /^\s*(<!doctype|<html|<head|<body|<\?xml)/i.test(text.slice(0, 200));
        if (ct.includes('text/html') || looksHtml) return { text: '', status: 'invalid' };
        return { text, status: 'ok' };
      } catch (e) {
        return { text: '', status: 'unreachable' };
      }
    };
    const [rf, lf] = await Promise.all([getFile('/robots.txt'), getFile('/llms.txt')]);
    const robots = rf.text, llms = lf.text;

    return res.status(200).json({
      success: true,
      url: targetUrl,
      html,
      robots,
      llms,
      robotsStatus: rf.status,
      llmsStatus: lf.status
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Scanning error: ' + error.message
    });
  }
}
