import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';

export const GET: APIRoute = async (context) => {
  try {
    const recipe_id = context.params.recipe_id;

    if (!recipe_id || typeof recipe_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid recipe_id' }),
        { status: 400 }
      );
    }

    // Fetch comment hearts with comment details
    const { data, error } = await supabase
      .from('comment_hearts')
      .select(`
        comment_id,
        user_id,
        comments(id)
      `)
      .eq('comments.recipe_id', recipe_id);

    if (error) {
      console.error('Fetch hearts error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch hearts' }),
        { status: 500 }
      );
    }

    // Aggregate hearts by comment_id and track user_ids
    const heartCounts: Record<string, number> = {};
    const heartsByUser: Record<string, string[]> = {}; // comment_id -> [user_ids]
    
    for (const heart of data || []) {
      heartCounts[heart.comment_id] = (heartCounts[heart.comment_id] || 0) + 1;
      if (!heartsByUser[heart.comment_id]) {
        heartsByUser[heart.comment_id] = [];
      }
      heartsByUser[heart.comment_id].push(heart.user_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        hearts: heartCounts,
        heartsByUser: heartsByUser
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Hearts API error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
