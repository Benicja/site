import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

export const POST: APIRoute = async (context) => {
  try {
    // Simple test insert
    const result = await supabaseAdmin
      .from('comments')
      .insert({
        album_id: 'test-album-123',
        recipe_id: null,
        user_id: 'test-user-123',
        user_name: 'Test User',
        user_image: null,
        content: 'Test comment'
      })
      .select()
      .single();

    if (result.error) {
      console.error('Test insert error:', result.error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert', 
          details: result.error,
          code: result.error?.code,
          message: result.error?.message,
          hint: result.error?.message
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Test endpoint error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', details: String(err) }),
      { status: 500 }
    );
  }
};
