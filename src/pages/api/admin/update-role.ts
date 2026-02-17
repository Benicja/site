import type { APIRoute, APIContext } from 'astro';
import { SESSION_COOKIE, getApprovedUser, getUserFromSession } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

async function getAdminFromSession(cookies: APIContext['cookies']) {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;
  const user = sessionId ? await getUserFromSession(sessionId) : null;
  if (!user) return null;

  const approvedUser = await getApprovedUser(user.user_email);
  if (approvedUser?.role !== 'admin') return null;
  return user;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = await getAdminFromSession(cookies);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id, role } = await request.json();
  if (!id || !['admin', 'user'].includes(role)) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { error } = await supabaseAdmin
    .from('approved_users')
    .update({ role })
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to update role' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
