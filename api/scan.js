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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SearchLens/1.0'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'Website open nahi ho saki (Status: ' + response.status + ')' });
    }

    const html = await response.text();

    // Optionally robots.txt aur llms.txt bhi fetch karein
    let robots = '', llms = '';
    try {
      const origin = new URL(targetUrl).origin;
      const rRes = await fetch(`${origin}/robots.txt`);
      if (rRes.ok) robots = await rRes.text();
      const lRes = await fetch(`${origin}/llms.txt`);
      if (lRes.ok) llms = await lRes.text();
    } catch (e) {}

    return res.status(200).json({
      success: true,
      url: targetUrl,
      html,
      robots,
      llms
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Scanning error: ' + error.message
    });
  }
}
