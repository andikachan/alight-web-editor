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

  // 1. Extract packageId from Alight Motion share link if present
  const pkgMatch = cleanUrl.match(/\/p\/([a-zA-Z0-9_-]+)/);
  const packageId = pkgMatch ? pkgMatch[1] : null;

  // 2. Check local packages first (fast cache)
  if (packageId) {
    const candidates = [
      '134def6d-30e3-485b-9e9a-e083454dfd11.xml',
      '48b1ce50-dedd-4312-a1fb-e0451400bfee.xml',
      'project.xml',
      `${packageId}.xml`
    ];

    for (const xmlFile of candidates) {
      try {
        const pkgXmlUrl = new URL(`/packages/${packageId}/${xmlFile}`, context.request.url);
        const pkgResp = await context.env.ASSETS.fetch(pkgXmlUrl);
        if (pkgResp.ok) {
          const xmlContent = await pkgResp.text();
          const titleMatch = xmlContent.match(/<scene[^>]*title="([^"]+)"/);
          const title = titleMatch ? titleMatch[1] : "Alight Motion Project";

          if (packageId === '54bZI53R1P-d6cb038096fd41bb') {
            return new Response(JSON.stringify({
              url: cleanUrl,
              xml: xmlContent,
              packageId: packageId,
              meta: {
                title: "BUAHLIL (upin zet) udh pake jan lupa cr yak😁 - Alight Motion",
                description: "This Alight Motion package contains 1 project, total 3.6 MB.",
                thumb: "https://firebasestorage.googleapis.com/v0/b/alight-creative.appspot.com/o/share%2Fu%2FHc6ygrB4EfdBFUF7FN6c0nf7nom1%2Fp%2F54bZI53R1P-d6cb038096fd41bb%2Fthumb-small.jpg?alt=media&token=1b9ed0f8-b7ca-4224-b9ac-d8b9500c3b35"
              },
              projects: [
                {
                  name: "134def6d-30e3-485b-9e9a-e083454dfd11.xml",
                  title: "BUAHLIL (upin zet) udh pake jan lupa cr yak&#128513;",
                  characters: xmlContent.length
                }
              ],
              xmlName: "134def6d-30e3-485b-9e9a-e083454dfd11.xml",
              media: [
                {
                  name: "mix_2026-06-07_14-54-16_145600518.wav",
                  size: 3997792,
                  mime: "audio/wav",
                  url: `/api/link/${packageId}/media/mix_2026-06-07_14-54-16_145600518.wav`
                },
                {
                  name: "manifest.txt",
                  size: 78,
                  mime: "application/octet-stream",
                  url: `/api/link/${packageId}/media/manifest.txt`
                }
              ]
            }), {
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }

          if (packageId === 'BwZphAJZiX-9a29db0869571c82') {
            return new Response(JSON.stringify({
              url: cleanUrl,
              packageId: packageId,
              xml: xmlContent,
              xmlName: '48b1ce50-dedd-4312-a1fb-e0451400bfee.xml',
              title: null,
              meta: {
                title: "Proyek baru 321",
                author: "Alight Motion Creator",
                packageId: packageId
              },
              projects: [
                { name: '48b1ce50-dedd-4312-a1fb-e0451400bfee.xml', title: "Proyek baru 321", characters: xmlContent.length }
              ],
              media: [
                { name: "mix_2025-06-21_13-21-27.wav", size: 5042220, mime: "audio/wav", url: `/api/link/${packageId}/media/mix_2025-06-21_13-21-27.wav` },
                { name: "1000913283..png", size: 1966412, mime: "image/png", url: `/api/link/${packageId}/media/1000913283..png` },
                { name: "1000913284..png", size: 1941611, mime: "image/png", url: `/api/link/${packageId}/media/1000913284..png` },
                { name: "1000913282..png", size: 1726831, mime: "image/png", url: `/api/link/${packageId}/media/1000913282..png` },
                { name: "manifest.txt", size: 239, mime: "application/octet-stream", url: `/api/link/${packageId}/media/manifest.txt` }
              ]
            }), {
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }

          return new Response(JSON.stringify({
            url: cleanUrl,
            packageId: packageId,
            xml: xmlContent,
            xmlName: xmlFile,
            title: title,
            meta: {
              title: title,
              author: "Alight Motion Creator",
              packageId: packageId
            },
            projects: [
              { name: xmlFile, title: title, characters: xmlContent.length }
            ],
            media: []
          }), {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch (e) {}
    }
  }

  // 3. Automatic dynamic resolver for ANY Alight Motion share link
  try {
    let upstreamUrl = `https://am.zervida.my.id/api/project-xml?url=${encodeURIComponent(cleanUrl)}`;
    if (projectParam) {
      upstreamUrl += `&project=${encodeURIComponent(projectParam)}`;
    }

    const upstreamResp = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (upstreamResp.ok) {
      const data = await upstreamResp.json();
      if (data && (data.xml || data.projects)) {
        // Ensure all media URLs route through our own domain's /api/link/
        if (Array.isArray(data.media)) {
          data.media = data.media.map(m => {
            const mediaName = m.name || (m.url ? m.url.split('/').pop() : 'media');
            const pkg = data.packageId || packageId || 'unknown';
            return {
              ...m,
              url: `/api/link/${pkg}/media/${encodeURIComponent(mediaName)}`
            };
          });
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  } catch (e) {}

  // 4. Google Drive link handling
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

  // 5. Direct XML URL handling
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
    error: "Gagal memproses link Alight Motion. Silakan gunakan link share Alight Motion yang valid, link XML, atau upload file .xml."
  }), {
    status: 422,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
