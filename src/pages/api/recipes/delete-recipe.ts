import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { promises as fs } from 'fs';
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
    const recipePath = path.join(process.cwd(), 'src', 'content', 'recipes', `${slug}.md`);
    
    // Verify the file exists and is in the recipes directory
    const recipesDir = path.join(process.cwd(), 'src', 'content', 'recipes');
    const resolvedPath = path.resolve(recipePath);
    const resolvedDir = path.resolve(recipesDir);
    
    if (!resolvedPath.startsWith(resolvedDir)) {
      return new Response(JSON.stringify({ error: 'Invalid recipe path' }), { status: 400 });
    }

    // Delete the recipe file
    await fs.unlink(recipePath);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Recipe deleted successfully'
    }));

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new Response(JSON.stringify({ error: 'Recipe file not found' }), { status: 404 });
    }
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
