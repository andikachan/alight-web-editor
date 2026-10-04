export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const effectId = url.searchParams.get('id');

  if (!effectId) {
    return new Response("Missing id parameter", {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Determine effect filename
  let effectFile = effectId;
  try {
    const idxResp = await context.env.ASSETS.fetch(new URL('/runtime/effect-index.json', context.request.url));
    if (idxResp.ok) {
      const effectIndex = await idxResp.json();
      if (effectIndex[effectId]) {
        effectFile = effectIndex[effectId];
      }
    }
  } catch (e) {}

  if (!effectFile.endsWith('.xml')) {
    effectFile += '.xml';
  }

  // Fetch local XML from /runtime/effects_xml/
  const xmlPath = `/runtime/effects_xml/${effectFile}`;
  try {
    const assetResp = await context.env.ASSETS.fetch(new URL(xmlPath, context.request.url));
    if (assetResp.ok) {
      const data = await assetResp.text();
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'X-Effect-File': effectFile,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': 'X-Effect-File, Content-Type, Content-Length',
          'Cache-Control': 'public, max-age=2592000, s-maxage=2592000'
        }
      });
    }
  } catch (e) {}

  return new Response("Effect XML not found", {
    status: 404,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
