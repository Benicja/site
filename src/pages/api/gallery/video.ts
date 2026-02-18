import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  const baseUrl = url.searchParams.get('url');

  if (!baseUrl) {
    return new Response('Missing video URL', { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(baseUrl);
    const videoUrl = `${decodedUrl}=dv`;
    const range = request.headers.get('range') || undefined;
    const wantsHead = request.method === 'HEAD';
    const upstreamRange = range || (wantsHead ? undefined : 'bytes=0-');

    const response = await fetch(videoUrl, {
      method: wantsHead ? 'HEAD' : 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://photos.google.com/',
        ...(upstreamRange ? { Range: upstreamRange } : {})
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');

    if (!response.ok && response.status !== 206) {
      return new Response('Failed to fetch video', { status: response.status });
    }

    if (contentType.includes('text/html')) {
      return new Response('Upstream returned HTML instead of video', { status: 502 });
    }

    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    } else {
      headers.set('Content-Type', 'video/mp4');
    }
    if (contentLength) headers.set('Content-Length', contentLength);
    if (contentRange) headers.set('Content-Range', contentRange);
    if (acceptRanges) {
      headers.set('Accept-Ranges', acceptRanges);
    } else {
      headers.set('Accept-Ranges', 'bytes');
    }

    headers.set('Cache-Control', 'public, max-age=604800');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(wantsHead ? null : response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return new Response('Error fetching video', { status: 500 });
  }
};
