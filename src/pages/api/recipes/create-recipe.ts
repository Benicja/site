import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { commitToGitHub, readFromGitHub } from '../../../lib/github';
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

// Helper function to escape YAML strings
const escapeYamlString = (str: string): string => {
  if (!str) return '""';
  return `"${str.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
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

    // Build frontmatter
    const frontmatterLines: string[] = [];
    frontmatterLines.push(`title: ${escapeYamlString(title)}`);
    frontmatterLines.push(`description: ${escapeYamlString(description || '')}`);
    if (featured_image) {
      frontmatterLines.push(`featured_image: ${escapeYamlString(featured_image)}`);
    }
    frontmatterLines.push(`prep_time: ${parseInt(prep_time) || 0}`);
    frontmatterLines.push(`cook_time: ${parseInt(cook_time) || 0}`);
    if (servings) {
      frontmatterLines.push(`servings: ${parseInt(servings) || 0}`);
    }
    frontmatterLines.push(`category: ${escapeYamlString(category || 'Other')}`);
    frontmatterLines.push(`publishDate: ${new Date().toISOString().split('T')[0]}`);

    // Add ingredients if provided
    if (ingredients && ingredients.length > 0) {
      frontmatterLines.push('');
      frontmatterLines.push('ingredients:');
      for (const item of ingredients) {
        frontmatterLines.push(`  - item: ${escapeYamlString(item.item || '')}`);
        frontmatterLines.push(`    amount: ${escapeYamlString(item.amount || '')}`);
      }
    } else {
      frontmatterLines.push('');
      frontmatterLines.push('ingredients: []');
    }

    // Add instructions if provided
    if (instructions && instructions.length > 0) {
      frontmatterLines.push('');
      frontmatterLines.push('instructions:');
      for (const ins of instructions) {
        frontmatterLines.push(`  - step: ${escapeYamlString(ins.step || '')}`);
      }
    } else {
      frontmatterLines.push('');
      frontmatterLines.push('instructions: []');
    }

    // Create the markdown file content
    const content = `---\n${frontmatterLines.join('\n')}\n---\n\n`;

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
