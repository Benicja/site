import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;
  console.log('Sync Request:', { hasSession: !!sessionId });

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'No session found. Please sign in again.' }), { status: 401 });
  }

  const isAdmin = await isUserAdmin(sessionId);
  console.log('Admin Check:', { isAdmin });

  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin role required' }), { status: 403 });
  }

  const { url } = await request.json();
  if (!url || !url.includes('photos.app.goo.gl') && !url.includes('photos.google.com')) {
    return new Response(JSON.stringify({ error: 'Invalid Google Photos URL' }), { status: 400 });
  }

  try {
    // 1. Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await response.text();
    console.log('HTML fetched, length:', html.length);

    // 2. Extract Album Title and Metadata
    let title = 'Untitled Album';
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    } else {
      const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (pageTitleMatch && pageTitleMatch[1]) {
        title = pageTitleMatch[1];
      }
    }

    // Clean up title:
    // 1. Decode HTML entities (basic ones)
    title = title.replace(/&amp;/g, '&')
                 .replace(/&quot;/g, '"')
                 .replace(/&#39;/g, "'")
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>');
    
    // 2. Remove "Album: " and " - Google Photos"
    title = title.replace('Album: ', '').replace(' - Google Photos', '');

    // 3. Remove date range suffixes (e.g. " · Nov 30...")
    if (title.includes(' · ')) {
      title = title.split(' · ')[0];
    }

    // 4. Remove Emojis and trim
    title = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    const coverMatch = html.match(/<meta property="og:image" content="([^"]+)">/);
    let coverUrl = coverMatch ? coverMatch[1].split('=')[0] : null;

    // 3. Extract Photo URLs
    // Google Photos sharing pages contain image URLs starting with https://lh3.googleusercontent.com/
    // We allow slashes to get the full path.
    const photoUrlRegex = /(https:\/\/lh[0-9]\.googleusercontent\.com\/[a-zA-Z0-9\-_/]+)/g;
    const matches = Array.from(html.matchAll(photoUrlRegex));
    console.log('Total regex matches found:', matches.length);
    
    // Filter and clean URLs
    const baseUrls = matches.map(m => m[0])
      .filter(url => url.length > 60) 
      .filter(url => !url.includes('googleusercontent.com/a/')) // Ignore profile pictures
      .map(url => url.split('=')[0]); // Get base URL without sizing params

    const uniqueBaseUrls = [...new Set(baseUrls)];
    console.log('Found unique photo URLs:', uniqueBaseUrls.length);

    if (uniqueBaseUrls.length === 0) {
      return new Response(JSON.stringify({ 
        error: `No photos found. Found ${matches.length} matches, but all filtered. First match: ${matches[0] ? matches[0][0] : 'none'}`,
      }), { status: 404 });
    }

    // 4. Generate a unique ID for the album
    const urlParts = url.split('/').filter(Boolean);
    const albumUrlId = urlParts.pop()?.split('?')[0] || Date.now().toString();

    // 5. Upsert Album
    const { data: album, error: albumError } = await supabaseAdmin
      .from('gallery_albums')
      .upsert({
        google_album_id: albumUrlId,
        title: title,
        cover_image_url: coverUrl || uniqueBaseUrls[0],
        album_url: url,
        photo_count: uniqueBaseUrls.length,
        updated_at: new Date().toISOString()
      }, { onConflict: 'google_album_id' })
      .select()
      .single();

    if (albumError) throw albumError;

    // 6. Upsert Photos
    const photoRows = uniqueBaseUrls.map((photoUrl, index) => {
      const photoId = `${albumUrlId}_photo_${index}`;
      return {
        google_photo_id: photoId,
        album_id: albumUrlId,
        image_url: photoUrl
      };
    });

    const { error: photoError } = await supabaseAdmin
      .from('gallery_photos')
      .upsert(photoRows, { onConflict: 'google_photo_id' });

    if (photoError) throw photoError;

    return new Response(JSON.stringify({ 
      success: true, 
      count: uniqueBaseUrls.length,
      title: title
    }));

  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
