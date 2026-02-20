import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const GET: APIRoute = async (context) => {
  try {
    const album_id = context.params.album_id;

    if (!album_id || typeof album_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid album_id' }),
        { status: 400 }
      );
    }

    // Fetch all comments for the album, ordered by newest first
    // Try filtering for non-deleted comments, but fall back to all comments if column doesn't exist
    let { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('album_id', album_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // If the deleted_at column doesn't exist yet, fall back to fetching all comments
    if (error && error.message.includes('deleted_at')) {
      console.warn('deleted_at column does not exist yet, fetching all comments');
      const fallback = await supabase
        .from('comments')
        .select('*')
        .eq('album_id', album_id)
        .order('created_at', { ascending: false });
      
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Fetch comments error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch comments' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        comments: data || [] 
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Comments API error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
