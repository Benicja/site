import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'No session found. Please sign in again.' }), { status: 401 });
  }

  const isAdmin = await isUserAdmin(sessionId);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin role required' }), { status: 403 });
  }

  const { slugs } = await request.json();
  if (!Array.isArray(slugs)) {
    return new Response(JSON.stringify({ error: 'Recipe slugs array required' }), { status: 400 });
  }

  try {
    // Store the recipe order in Supabase
    const { error } = await supabaseAdmin
      .from('recipe_order')
      .upsert(
        { id: 'primary', order_slugs: slugs, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Supabase error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Failed to save recipe order' }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Recipe order saved successfully'
    }));

  } catch (error: any) {
    console.error('Reorder error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('recipe_order')
      .select('order_slugs, updated_at')
      .eq('id', 'primary')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return new Response(JSON.stringify({ slugs: data.order_slugs || [], lastUpdated: data.updated_at }));
    }

    // No order found, return empty
    return new Response(JSON.stringify({ slugs: [], lastUpdated: null }));

  } catch (error: any) {
    console.error('Get order error:', error);
    return new Response(JSON.stringify({ slugs: [], lastUpdated: null }));
  }
};
