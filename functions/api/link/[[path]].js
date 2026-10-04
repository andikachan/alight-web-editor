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
  const filename = match[2];

  // Try serving from /packages/${packageId}/${filename}
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

  return new Response("Media not found", {
    status: 404,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
