import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { readFromGitHub, commitToGitHub } from '../../../lib/github';
import { promises as fs } from 'fs';
import path from 'path';

export const prerender = false;

// Helper function to escape quotes in YAML strings
const escapeYamlString = (str: string): string => {
  if (!str) return '""';
  return `"${str.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
};

// Helper function to serialize ingredients/instructions arrays to YAML format
const serializeArray = (fieldName: string, items: any[]): string[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const lines: string[] = [fieldName + ':'];

  for (const item of items) {
    if (fieldName === 'ingredients') {
      // Format: item, amount
      lines.push(`  - item: ${escapeYamlString(item.item || '')}`);
      lines.push(`    amount: ${escapeYamlString(item.amount || '')}`);
    } else if (fieldName === 'instructions') {
      // Format: step
      lines.push(`  - step: ${escapeYamlString(item.step || '')}`);
    }
  }

  return lines;
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

    const originalFrontmatterLines = lines.slice(1, frontmatterEndLine);
    const bodyContent = lines.slice(frontmatterEndLine + 1).join('\n').trim();

    // Build new frontmatter - start with fields we're editing
    const newFrontmatterLines: string[] = [];
    newFrontmatterLines.push(`title: ${escapeYamlString(title)}`);
    newFrontmatterLines.push(`description: ${escapeYamlString(description)}`);
    if (featured_image) {
        newFrontmatterLines.push(`featured_image: ${escapeYamlString(featured_image)}`);
    }
    newFrontmatterLines.push(`prep_time: ${prep_time}`);
    newFrontmatterLines.push(`cook_time: ${cook_time}`);
    if (servings) {
        newFrontmatterLines.push(`servings: ${servings}`);
    }
    newFrontmatterLines.push(`category: ${escapeYamlString(category)}`);


    // Add ingredients if provided
    if (ingredients && ingredients.length > 0) {
        newFrontmatterLines.push('');
        newFrontmatterLines.push(...serializeArray('ingredients', ingredients));
    }

    // Add instructions if provided
    if (instructions && instructions.length > 0) {
        newFrontmatterLines.push('');
        newFrontmatterLines.push(...serializeArray('instructions', instructions));
    }

    // Preserve fields we're not editing (publishDate, draft)
    const fieldsToPreserve = ['publishDate', 'draft'];

    for (const fieldName of fieldsToPreserve) {
        // Find where this field starts in the original frontmatter
        let fieldStartIdx = -1;
        for (let i = 0; i < originalFrontmatterLines.length; i++) {
            if (originalFrontmatterLines[i].startsWith(fieldName + ':')) {
                fieldStartIdx = i;
                break;
            }
        }

        if (fieldStartIdx !== -1) {
            newFrontmatterLines.push('');
            newFrontmatterLines.push(originalFrontmatterLines[fieldStartIdx]);
        }
    }

    const newContent = `---\n${newFrontmatterLines.join('\n')}\n---\n\n${bodyContent}`;

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
