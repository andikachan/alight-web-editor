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

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const driveUrl = url.searchParams.get('url');

  if (!driveUrl) {
    return new Response(JSON.stringify({ error: "Bukan link Google Drive yang valid. Contoh: https://drive.google.com/file/d/ID/view" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const fileId = extractDriveId(driveUrl);
  if (!fileId) {
    return new Response(JSON.stringify({ error: "Bukan link Google Drive yang valid. Contoh: https://drive.google.com/file/d/ID/view" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const downloadUrls = [
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`,
      `https://docs.google.com/uc?export=download&id=${fileId}`,
      `https://drive.google.com/uc?id=${fileId}&export=download`
    ];

    let resp = null;
    for (const dlUrl of downloadUrls) {
      try {
        const r = await fetch(dlUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          redirect: 'follow'
        });
        if (r.ok) {
          resp = r;
          break;
        }
      } catch (e) {}
    }

    if (!resp) {
      return new Response(JSON.stringify({ error: "Gagal mengunduh file dari Google Drive. Pastikan link bersifat Publik (Siapa saja yang memiliki link)." }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const xmlContent = await resp.text();
    const filename = parseFilename(resp.headers.get('content-disposition')) || `preset_${fileId.slice(0, 6)}.xml`;

    return new Response(JSON.stringify({
      xml: xmlContent,
      name: filename
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Gagal memproses file Google Drive" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
