export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const tiktokUrl = url.searchParams.get('url');

  if (!tiktokUrl) {
    return new Response(JSON.stringify({ error: "Parameter url TikTok wajib diisi." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    // 1. Try TikWM API
    const tikwmResp = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (tikwmResp.ok) {
      const data = await tikwmResp.json();
      if (data && data.code === 0 && data.data) {
        const musicUrl = data.data.music || data.data.play || data.data.wmplay;
        const title = data.data.title || "TikTok Audio";
        return new Response(JSON.stringify({
          media: musicUrl,
          title: title
        }), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 2. Fallback to Tiklydown API
    const tiklyResp = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(tiktokUrl)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (tiklyResp.ok) {
      const data = await tiklyResp.json();
      const musicUrl = data?.music?.play_url || data?.video?.noWatermark || data?.video?.watermark;
      if (musicUrl) {
        return new Response(JSON.stringify({
          media: musicUrl,
          title: data.title || "TikTok Audio"
        }), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    return new Response(JSON.stringify({ error: "Gagal mengekstrak audio dari link TikTok tersebut." }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Terjadi kesalahan server saat mengambil audio TikTok." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
