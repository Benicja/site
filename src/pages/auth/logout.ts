import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Clear session cookie
  cookies.delete(SESSION_COOKIE, { path: '/' });
  
  // Redirect to home
  return redirect('/');
};

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Clear session cookie
  cookies.delete(SESSION_COOKIE, { path: '/' });
  
  // Redirect to home
  return redirect('/');
};
