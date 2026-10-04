const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const mediaMemoryCache = new Map();

function extractDriveId(urlStr) {
  if (!urlStr) return null;
  const match1 = urlStr.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  const match2 = urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  if (/^[a-zA-Z0-9_-]{20,60}$/.test(urlStr.trim())) return urlStr.trim();
  return null;
}

function parseFilename(contentDisposition) {
  if (!contentDisposition) return null;
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch) return decodeURIComponent(utfMatch[1]);
  const normMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (normMatch) return normMatch[1];
  return null;
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = decodeURIComponent(reqUrl.pathname);

  // Global CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: /api/presets
  if (pathname === '/api/presets') {
    const presetsFile = path.join(__dirname, 'api', 'presets.json');
    if (fs.existsSync(presetsFile)) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      fs.createReadStream(presetsFile).pipe(res);
      return;
    }
  }

  // API: /api/drive-xml
  if (pathname === '/api/drive-xml') {
    const driveUrl = reqUrl.searchParams.get('url');
    const fileId = extractDriveId(driveUrl);
    if (!fileId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: "Bukan link Google Drive yang valid. Contoh: https://drive.google.com/file/d/ID/view" }));
      return;
    }
    try {
      const dlUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
      const fetchResp = await fetch(dlUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow'
      });
      if (!fetchResp.ok) throw new Error("Gagal mengunduh file Google Drive");
      const xmlContent = await fetchResp.text();
      const filename = parseFilename(fetchResp.headers.get('content-disposition')) || `preset_${fileId.slice(0, 6)}.xml`;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ xml: xmlContent, name: filename }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: /api/drive-media
  if (pathname === '/api/drive-media') {
    const driveUrl = reqUrl.searchParams.get('url');
    const fileId = extractDriveId(driveUrl);
    if (!fileId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: "Bukan link Google Drive yang valid." }));
      return;
    }
    try {
      const dlUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
      const fetchResp = await fetch(dlUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow'
      });
      if (!fetchResp.ok) throw new Error("Gagal mengunduh media Google Drive");
      res.writeHead(200, {
        'Content-Type': fetchResp.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': fetchResp.headers.get('content-disposition') || `inline; filename="drive_${fileId}"`
      });
      const buffer = Buffer.from(await fetchResp.arrayBuffer());
      res.end(buffer);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: /api/tiktok
  if (pathname === '/api/tiktok') {
    const tiktokUrl = reqUrl.searchParams.get('url');
    if (!tiktokUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: "Parameter url TikTok wajib diisi." }));
      return;
    }
    try {
      const tikResp = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`);
      const data = await tikResp.json();
      if (data && data.code === 0 && data.data) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          media: data.data.music || data.data.play,
          title: data.data.title || "TikTok Audio"
        }));
        return;
      }
      throw new Error("Gagal mengekstrak audio TikTok.");
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: /api/project-xml
  if (pathname === '/api/project-xml') {
    const alightUrl = reqUrl.searchParams.get('url');
    const projectParam = reqUrl.searchParams.get('project');
    if (!alightUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: "Link share Alight Motion wajib diisi." }));
      return;
    }

    const cleanUrl = alightUrl.trim();

    // 1. Google Drive direct check
    const driveIdMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveIdMatch || cleanUrl.includes('drive.google.com')) {
      const fileId = driveIdMatch ? driveIdMatch[1] : null;
      if (fileId) {
        try {
          const dlUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
          const fetchResp = await fetch(dlUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
          if (fetchResp.ok) {
            const bodyText = await fetchResp.text();
            if (bodyText.includes('<scene') || bodyText.includes('<?xml')) {
              const xmlMatch = bodyText.match(/<scene[^>]*title="([^"]+)"/);
              const title = xmlMatch ? xmlMatch[1] : `Drive Project ${fileId.slice(0, 6)}`;
              const xmlName = `preset_${fileId.slice(0, 6)}.xml`;
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({
                url: cleanUrl,
                xml: bodyText,
                xmlName: xmlName,
                title: title,
                projects: [{ name: xmlName, title: title, characters: bodyText.length }],
                media: []
              }));
              return;
            }
          }
        } catch (e) {}
      }
    }

    // 2. Direct XML URL
    if (cleanUrl.endsWith('.xml') || cleanUrl.includes('.xml?') || cleanUrl.startsWith('http')) {
      try {
        const directResp = await fetch(cleanUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          redirect: 'follow'
        });
        if (directResp.ok) {
          const bodyText = await directResp.text();
          if (bodyText.includes('<scene') || (bodyText.includes('<?xml') && bodyText.includes('<scene'))) {
            const xmlMatch = bodyText.match(/<scene[^>]*title="([^"]+)"/);
            const title = xmlMatch ? xmlMatch[1] : 'Alight Motion Project';
            const xmlName = 'project.xml';
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              url: cleanUrl,
              xml: bodyText,
              xmlName: xmlName,
              title: title,
              projects: [{ name: xmlName, title: title, characters: bodyText.length }],
              media: []
            }));
            return;
          }
        }
      } catch (e) {}
    }

    // 3. Serve from local packages directory
    const linkMatch = pathname.match(/\/api\/link\/([^/]+)\/media\/(.+)/);
    if (linkMatch) {
      const packageId = linkMatch[1];
      const filename = linkMatch[2];
      const localFile = path.join(__dirname, 'packages', packageId, filename);
      if (fs.existsSync(localFile)) {
        const ext = path.extname(localFile).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const buffer = fs.readFileSync(localFile);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=604800'
        });
        res.end(buffer);
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: "Media not found" }));
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);

  const range = req.headers.range;
  if (range && (ext === '.mp4' || ext === '.mp3' || ext === '.wav')) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, () => {
  console.log(`> AM Web Preset Player server running at http://localhost:${PORT}`);
  console.log(`> Main Player: http://localhost:${PORT}/runtime/preset.html`);
  console.log(`> WebGL Preview: http://localhost:${PORT}/runtime/preview.html`);
});
