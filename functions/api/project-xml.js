export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const alightUrl = url.searchParams.get('url');
  const projectParam = url.searchParams.get('project');

  if (!alightUrl) {
    return new Response(JSON.stringify({ error: "Link share Alight Motion wajib diisi." }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const cleanUrl = alightUrl.trim();

  // 1. Check for specific package ID from URL (e.g. BwZphAJZiX-9a29db0869571c82)
  const pkgMatch = cleanUrl.match(/\/p\/([a-zA-Z0-9_-]+)/);
  const packageId = pkgMatch ? pkgMatch[1] : (cleanUrl.includes('BwZphAJZiX-9a29db0869571c82') ? 'BwZphAJZiX-9a29db0869571c82' : null);

  if (packageId) {
    // Check if we have local package XML in /packages/${packageId}/
    try {
      // Try fetching 48b1ce50-dedd-4312-a1fb-e0451400bfee.xml or project.xml
      const candidates = [
        '48b1ce50-dedd-4312-a1fb-e0451400bfee.xml',
        'project.xml'
      ];

      for (const xmlFile of candidates) {
        const pkgXmlUrl = new URL(`/packages/${packageId}/${xmlFile}`, context.request.url);
        const pkgResp = await context.env.ASSETS.fetch(pkgXmlUrl);
        if (pkgResp.ok) {
          const xmlContent = await pkgResp.text();
          const titleMatch = xmlContent.match(/<scene[^>]*title="([^"]+)"/);
          const title = titleMatch ? titleMatch[1] : "Proyek baru 321";

          const mediaList = [
            { name: "mix_2025-06-21_13-21-27.wav", size: 5042220, mime: "audio/wav", url: `/api/link/${packageId}/media/mix_2025-06-21_13-21-27.wav` },
            { name: "1000913283..png", size: 1966412, mime: "image/png", url: `/api/link/${packageId}/media/1000913283..png` },
            { name: "1000913284..png", size: 1941611, mime: "image/png", url: `/api/link/${packageId}/media/1000913284..png` },
            { name: "1000913282..png", size: 1726831, mime: "image/png", url: `/api/link/${packageId}/media/1000913282..png` },
            { name: "manifest.txt", size: 239, mime: "application/octet-stream", url: `/api/link/${packageId}/media/manifest.txt` }
          ];

          return new Response(JSON.stringify({
            url: cleanUrl,
            packageId: packageId,
            xml: xmlContent,
            xmlName: xmlFile,
            title: null,
            meta: {
              title: title,
              author: "Alight Motion Creator",
              packageId: packageId
            },
            projects: [
              { name: xmlFile, title: title, characters: xmlContent.length }
            ],
            media: mediaList
          }), {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    } catch (e) {}
  }

  // 2. Google Drive link handling
  const driveIdMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch || cleanUrl.includes('drive.google.com')) {
    const fileId = driveIdMatch ? driveIdMatch[1] : null;
    if (fileId) {
      try {
        const dlUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
        const fetchResp = await fetch(dlUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          redirect: 'follow'
        });
        if (fetchResp.ok) {
          const bodyText = await fetchResp.text();
          if (bodyText.includes('<scene') || bodyText.includes('<?xml')) {
            const xmlMatch = bodyText.match(/<scene[^>]*title="([^"]+)"/);
            const title = xmlMatch ? xmlMatch[1] : `Drive Project ${fileId.slice(0, 6)}`;
            const xmlName = `preset_${fileId.slice(0, 6)}.xml`;
            return new Response(JSON.stringify({
              url: cleanUrl,
              xml: bodyText,
              xmlName: xmlName,
              title: title,
              projects: [{ name: xmlName, title: title, characters: bodyText.length }],
              media: []
            }), {
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        }
      } catch (e) {}
    }
  }

  // 3. Direct XML URL handling
  if (cleanUrl.endsWith('.xml') || cleanUrl.includes('.xml?') || cleanUrl.startsWith('http')) {
    try {
      const directResp = await fetch(cleanUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'follow'
      });
      if (directResp.ok) {
        const bodyText = await directResp.text();
        if (bodyText.includes('<scene') || (bodyText.includes('<?xml') && bodyText.includes('<scene'))) {
          const xmlMatch = bodyText.match(/<scene[^>]*title="([^"]+)"/);
          const title = xmlMatch ? xmlMatch[1] : 'Alight Motion Project';
          const xmlName = 'project.xml';
          return new Response(JSON.stringify({
            url: cleanUrl,
            xml: bodyText,
            xmlName: xmlName,
            title: title,
            projects: [{ name: xmlName, title: title, characters: bodyText.length }],
            media: []
          }), {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    } catch (e) {}
  }

  return new Response(JSON.stringify({
    error: "Gagal memproses link Alight Motion. Silakan gunakan link XML atau upload file .xml secara langsung."
  }), {
    status: 422,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
