export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }

  const url = new URL(context.request.url);
  const match = url.pathname.match(/\/api\/link\/([^/]+)\/media\/(.+)/);

  if (!match) {
    return new Response("Invalid link path", {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  const packageId = match[1];
  const rawFilename = match[2];
  const filename = decodeURIComponent(rawFilename);

  // 1. Try serving from local static assets (/packages/${packageId}/${filename})
  try {
    const assetUrl = new URL(`/packages/${packageId}/${filename}`, context.request.url);
    const assetResp = await context.env.ASSETS.fetch(assetUrl);

    if (assetResp.ok) {
      let contentType = 'application/octet-stream';
      if (filename.endsWith('.png')) contentType = 'image/png';
      else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (filename.endsWith('.wav')) contentType = 'audio/wav';
      else if (filename.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (filename.endsWith('.txt')) contentType = 'text/plain; charset=utf-8';
      else if (filename.endsWith('.xml')) contentType = 'application/xml; charset=utf-8';

      const data = await assetResp.arrayBuffer();
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=604800'
        }
      });
    }
  } catch (e) {}

  // 2. Automatic fallback / proxy from upstream resolver
  try {
    const upstreamUrl = `https://am.zervida.my.id/api/link/${packageId}/media/${encodeURIComponent(filename)}`;
    const upstreamResp = await fetch(upstreamUrl, {
      method: context.request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (upstreamResp.ok) {
      const respHeaders = new Headers(upstreamResp.headers);
      respHeaders.set('Access-Control-Allow-Origin', '*');
      respHeaders.set('Cache-Control', 'public, max-age=604800');
      return new Response(upstreamResp.body, {
        status: upstreamResp.status,
        headers: respHeaders
      });
    }
  } catch (e) {}

  return new Response("Media not found", {
    status: 404,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
