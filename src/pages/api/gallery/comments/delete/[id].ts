import type { APIRoute } from 'astro';
import { SESSION_COOKIE, getUserFromSession, isUserAdmin } from '../../../../../lib/auth';
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

    // Get comment ID from params
    const comment_id = context.params.id;
    if (!comment_id || typeof comment_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid comment_id' }),
        { status: 400 }
      );
    }

    // Fetch the comment to check ownership
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('user_id')
      .eq('id', comment_id)
      .single();

    if (fetchError || !comment) {
      return new Response(
        JSON.stringify({ error: 'Comment not found' }),
        { status: 404 }
      );
    }

    // Check if user is the owner or an admin
    const isOwner = comment.user_id === user.id;
    const isAdmin = await isUserAdmin(sessionId);

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }

    // Soft delete the comment by setting deleted_at timestamp
    const { error: deleteError } = await supabaseAdmin
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', comment_id);

    if (deleteError) {
      console.error('Delete comment error:', deleteError);
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
    console.error('Delete comment API error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
