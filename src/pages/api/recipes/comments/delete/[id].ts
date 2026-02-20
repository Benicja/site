import type { APIRoute } from 'astro';
import { SESSION_COOKIE, getUserFromSession } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

export const DELETE: APIRoute = async (context) => {
  try {
    // Check authentication
    const sessionId = context.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401 }
      );
    }

    const user = await getUserFromSession(sessionId);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Session invalid' }),
        { status: 401 }
      );
    }

    const commentId = context.params.id;
    if (!commentId) {
      return new Response(
        JSON.stringify({ error: 'Invalid comment ID' }),
        { status: 400 }
      );
    }

    // Get the comment to verify ownership
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return new Response(
        JSON.stringify({ error: 'Comment not found' }),
        { status: 404 }
      );
    }

    // Check if user owns the comment or is admin
    const { data: approvedUser } = await supabaseAdmin
      .from('approved_users')
      .select('role')
      .eq('email', user.user_email)
      .single();

    const isAdmin = approvedUser?.role === 'admin';
    const isOwner = comment.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete this comment' }),
        { status: 403 }
      );
    }

    // Mark comment as deleted (soft delete)
    const { error: deleteError } = await supabaseAdmin
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);

    if (deleteError) {
      console.error('Comment deletion error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete comment' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Comment delete API error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
