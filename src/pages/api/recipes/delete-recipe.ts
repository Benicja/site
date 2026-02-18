import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { deleteFromGitHub } from '../../../lib/github';
import path from 'path';

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

  const { slug } = await request.json();
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Recipe slug required' }), { status: 400 });
  }

  try {
    // Add recipe to deleted_recipes table in Supabase
    const { error } = await supabaseAdmin
      .from('deleted_recipes')
      .upsert({ recipe_slug: slug, deleted_at: new Date().toISOString() }, { onConflict: 'recipe_slug' });

    if (error) {
      console.error('Supabase error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Failed to delete recipe from database' }), { status: 500 });
    }

    // Secondary: Also delete file from GitHub
    try {
      const recipePath = path.join('src', 'content', 'recipes', `${slug}.md`);
      await deleteFromGitHub(recipePath, `Delete recipe: ${slug}`);
    } catch (gitError: any) {
      console.warn('Warning: Failed to delete file from GitHub:', gitError);
      // We continue since it's already "deleted" in Supabase
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Recipe deleted successfully'
    }));

  } catch (error: any) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
