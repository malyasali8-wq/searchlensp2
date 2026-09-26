export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: 'URL enter karna zaroori hai' });
  }

  try {
    // URL me protocol add karein agar nahi hai
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Target website ka HTML content fetch karein
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SearchLens/1.0'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'Website open nahi ho saki' });
    }

    const html = await response.text();

    // SEO aur GEO Elements Check
    const hasTitle = /<title[^>]*>[\s\S]*?<\/title>/i.test(html);
    const hasDescription = /<meta[^>]*name=["']description["'][^>]*>/i.test(html);
    const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html);
    const hasCanonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(html);
    const hasOgImage = /<meta[^>]*property=["']og:image["'][^>]*>/i.test(html);

    // Dynamic Score Calculation
    let score = 20; // Base score
    if (hasTitle) score += 20;
    if (hasDescription) score += 20;
    if (hasH1) score += 15;
    if (hasCanonical) score += 15;
    if (hasOgImage) score += 10;

    return res.status(200).json({
      success: true,
      url: targetUrl,
      score: score,
      details: {
        title: hasTitle,
        description: hasDescription,
        h1: hasH1,
        canonical: hasCanonical,
        ogImage: hasOgImage
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Scanning me issue aya: ' + error.message
    });
  }
}
