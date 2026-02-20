import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE, getUserFromSession } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { commitToGitHub, readFromGitHub } from '../../../lib/github';
import { buildRecipeFrontmatter, validateRecipeYAML } from '../../../lib/recipe-utils';
import path from 'path';

export const prerender = false;

// Generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'No session found. Please sign in again.' }), { status: 401 });
  }

  const isAdmin = await isUserAdmin(sessionId);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin role required' }), { status: 403 });
  }

  const body = await request.json();
  const { 
    title, 
    description, 
    featured_image, 
    prep_time, 
    cook_time, 
    servings, 
    category,
    ingredients,
    instructions
  } = body;

  if (!title) {
    return new Response(JSON.stringify({ error: 'Recipe title required' }), { status: 400 });
  }

  try {
    // Get user info to add as author
    const user = await getUserFromSession(sessionId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User session not found' }), { status: 401 });
    }

    // Generate slug from title
    const slug = generateSlug(title);
    const recipePath = path.join('src', 'content', 'recipes', `${slug}.md`);

    // Check if recipe already exists (using readFromGitHub)
    try {
      await readFromGitHub(recipePath);
      return new Response(JSON.stringify({ error: `Recipe "${slug}" already exists` }), { status: 409 });
    } catch {
      // Not found, continue
    }

    // Build authors array with current user
    const authors = user.user_name ? [{ name: user.user_name, ...(user.user_avatar && { image: user.user_avatar }) }] : undefined;

    // Build frontmatter using proper YAML library
    const content = buildRecipeFrontmatter({
      title,
      description: description || '',
      featured_image: featured_image || undefined,
      prep_time: parseInt(prep_time) || 0,
      cook_time: parseInt(cook_time) || 0,
      servings: servings ? parseInt(servings) : undefined,
      category: category || 'Other',
      ingredients: ingredients || [],
      instructions: instructions || [],
      publishDate: new Date().toISOString().split('T')[0],
      authors
    });

    // Validate generated YAML before committing
    const validationError = validateRecipeYAML(content);
    if (validationError) {
      console.error('Recipe validation failed:', validationError);
      return new Response(JSON.stringify({ error: `Invalid recipe format: ${validationError}` }), { status: 400 });
    }

    try {
      await commitToGitHub(recipePath, content, `Create recipe: ${title}`);
    } catch (writeError: any) {
      console.error('Failed to commit file to GitHub:', writeError);
      return new Response(JSON.stringify({ error: `Failed to save recipe: ${writeError.message}` }), { status: 500 });
    }

    // Add new recipe to the TOP of recipe order in Supabase
    try {
      // Get current order
      const { data: orderData } = await supabaseAdmin
        .from('recipe_order')
        .select('order_slugs')
        .eq('id', 'primary')
        .single();
      
      let recipeOrder: string[] = orderData?.order_slugs || [];
      
      // Add new slug to the beginning if not already present
      if (!recipeOrder.includes(slug)) {
        recipeOrder.unshift(slug);
        
        const { error } = await supabaseAdmin
          .from('recipe_order')
          .upsert({ id: 'primary', order_slugs: recipeOrder, updated_at: new Date().toISOString() }, { onConflict: 'id' });
        
        if (error) {
          console.error('Warning: Could not update recipe order:', error);
        }
      }
    } catch (orderError: any) {
      console.error('Warning: Could not update recipe order:', orderError);
      // Continue anyway, the recipe was created successfully
    }

    return new Response(JSON.stringify({
      success: true,
      slug,
      message: `Recipe "${title}" created successfully`
    }));

  } catch (error: any) {
    console.error('Create recipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'An error occurred while creating the recipe' }), { status: 500 });
  }
};
