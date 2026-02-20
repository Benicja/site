import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE, getUserFromSession } from '../../../lib/auth';
import { readFromGitHub, commitToGitHub } from '../../../lib/github';
import { buildRecipeFrontmatter, validateRecipeYAML } from '../../../lib/recipe-utils';
import { parse } from 'yaml';
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

  // Get current user info to add as author
  const user = await getUserFromSession(sessionId);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User session not found' }), { status: 401 });
  }

  const body = await request.json();
  const { 
    slug, 
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

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Recipe slug required' }), { status: 400 });
  }

  try {
    const recipePath = path.join('src', 'content', 'recipes', `${slug}.md`);
    
    // Read existing file to preserve content we're not editing
    let existingContent: string;
    try {
      existingContent = await readFromGitHub(recipePath);
    } catch (readError: any) {
      console.error('Failed to read file from GitHub:', readError);
      return new Response(JSON.stringify({ error: `Could not load recipe file: ${readError.message}` }), { status: 404 });
    }

    const lines = existingContent.split(/\r?\n/);

    if (lines[0] !== '---') {
      return new Response(JSON.stringify({ error: 'Invalid recipe format: missing opening delimiter' }), { status: 400 });
    }

    let frontmatterEndLine = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
            frontmatterEndLine = i;
            break;
        }
    }

    if (frontmatterEndLine === -1) {
        return new Response(JSON.stringify({ error: 'Invalid recipe format: missing closing delimiter' }), { status: 400 });
    }

    const bodyContent = lines.slice(frontmatterEndLine + 1).join('\n').trim();

    // Extract publishDate, draft, and authors from original frontmatter
    let publishDate: string | undefined;
    let draft: boolean | undefined;
    let authors: Array<{ name: string; image?: string }> = [];
    
    // Parse the frontmatter to extract authors array
    try {
      const frontmatterYaml = lines.slice(1, frontmatterEndLine).join('\n');
      const parsed = parse(frontmatterYaml);
      
      if (parsed.publishDate) {
        publishDate = parsed.publishDate;
      }
      if (parsed.draft !== undefined) {
        draft = parsed.draft;
      }
      if (Array.isArray(parsed.authors)) {
        authors = parsed.authors;
      }
    } catch (parseError) {
      console.error('Failed to parse frontmatter YAML:', parseError);
    }

    // Add current user as author if not already present
    const currentUserName = user?.user_name;
    if (currentUserName) {
      const authorExists = authors.some(author => author.name === currentUserName);
      if (!authorExists) {
        authors.push({
          name: currentUserName,
          ...(user?.user_avatar && { image: user.user_avatar })
        });
      }
    }

    // Build new frontmatter using YAML library
    const content = buildRecipeFrontmatter({
      title,
      description,
      featured_image: featured_image || undefined,
      prep_time: parseInt(prep_time) || 0,
      cook_time: parseInt(cook_time) || 0,
      servings: servings ? parseInt(servings) : undefined,
      category,
      ingredients: ingredients || [],
      instructions: instructions || [],
      publishDate: publishDate || new Date().toISOString().split('T')[0],
      draft: draft,
      authors: authors.length > 0 ? authors : undefined
    });

    // Reconstruct with body content
    const newContent = content + bodyContent;

    // Validate generated YAML before committing
    const validationError = validateRecipeYAML(newContent);
    if (validationError) {
      console.error('Recipe validation failed:', validationError);
      return new Response(JSON.stringify({ error: `Invalid recipe format: ${validationError}` }), { status: 400 });
    }

    try {
      await commitToGitHub(recipePath, newContent, `Update recipe: ${title}`);
    } catch (writeError: any) {
      console.error('Failed to commit update to GitHub:', writeError);
      return new Response(JSON.stringify({ error: `Could not save recipe file: ${writeError.message}` }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Recipe updated successfully'
    }));

  } catch (error: any) {
    console.error('Update error:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred while updating the recipe' }), { status: 500 });
  }
};
