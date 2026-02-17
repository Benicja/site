import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export const prerender = false;

const RECIPE_ORDER_FILE = path.join(process.cwd(), '.recipe-order.json');

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
    const orderData = {
      lastUpdated: new Date().toISOString(),
      slugs: slugs
    };

    // Write the order to a JSON file
    await fs.writeFile(RECIPE_ORDER_FILE, JSON.stringify(orderData, null, 2));

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
    try {
      const data = await fs.readFile(RECIPE_ORDER_FILE, 'utf-8');
      const orderData = JSON.parse(data);
      return new Response(JSON.stringify(orderData));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, return empty order
        return new Response(JSON.stringify({ slugs: [], lastUpdated: null }));
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Read error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
