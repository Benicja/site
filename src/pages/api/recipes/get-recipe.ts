import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export const prerender = false;

// Simple YAML array parser
const parseYamlArray = (lines: string[], startIdx: number): { items: any[], endIdx: number } => {
  const items: any[] = [];
  let endIdx = startIdx;

  // Skip the key line
  let i = startIdx + 1;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Stop if we hit a non-indented line that's not empty
    if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed !== '') {
      break;
    }

    // Process array items (lines starting with -)
    if (line.match(/^\s*-\s+/)) {
      const itemObj: any = {};

      // Parse first item on the dash line
      const dashMatch = line.match(/^\s*-\s+(.+)$/);
      if (dashMatch) {
        const contentMatch = dashMatch[1].match(/^(\w+):\s*(.+)$/);
        if (contentMatch) {
          const fieldKey = contentMatch[1];
          let fieldValue = contentMatch[2].trim();
          if ((fieldValue.startsWith('"') && fieldValue.endsWith('"')) || (fieldValue.startsWith("'") && fieldValue.endsWith("'"))) {
            fieldValue = fieldValue.slice(1, -1);
          }
          itemObj[fieldKey] = fieldValue;
        }
      }

      let j = i + 1;

      // Parse subsequent indented lines as part of this item
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();

        if (!nextLine.startsWith(' ') && !nextLine.startsWith('\t')) {
          break;
        }

        if (nextLine.match(/^\s+-\s+/)) {
          // Hit next array item
          break;
        }

        if (nextTrimmed !== '') {
          const fieldMatch = nextTrimmed.match(/^(\w+):\s*(.+)$/);
          if (fieldMatch) {
            let fieldValue = fieldMatch[2].trim();
            if ((fieldValue.startsWith('"') && fieldValue.endsWith('"')) || (fieldValue.startsWith("'") && fieldValue.endsWith("'"))) {
              fieldValue = fieldValue.slice(1, -1);
            }
            itemObj[fieldMatch[1]] = fieldValue;
          }
        }

        j++;
      }

      items.push(itemObj);
      endIdx = j - 1;
      i = j;
    } else if (trimmed === '') {
      i++;
      endIdx = i - 1;
    } else {
      i++;
      endIdx = i - 1;
    }
  }

  return { items, endIdx };
};

export const GET: APIRoute = async ({ url, cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'No session found. Please sign in again.' }), { status: 401 });
  }

  const isAdmin = await isUserAdmin(sessionId);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin role required' }), { status: 403 });
  }

  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Recipe slug required' }), { status: 400 });
  }

  try {
    const recipePath = path.join(process.cwd(), 'src', 'content', 'recipes', `${slug}.md`);
    
    // Verify the file is in the recipes directory
    const recipesDir = path.join(process.cwd(), 'src', 'content', 'recipes');
    const resolvedPath = path.resolve(recipePath);
    const resolvedDir = path.resolve(recipesDir);
    
    if (!resolvedPath.startsWith(resolvedDir)) {
      return new Response(JSON.stringify({ error: 'Invalid recipe path' }), { status: 400 });
    }

    // Check if file exists before attempting to read
    try {
      await fs.access(recipePath);
    } catch {
      return new Response(JSON.stringify({ error: 'Recipe file not found' }), { status: 404 });
    }

    let content: string;
    try {
      content = await fs.readFile(recipePath, 'utf-8');
    } catch (readError: any) {
      console.error('Failed to read file:', readError);
      return new Response(JSON.stringify({ error: 'Could not read recipe file. It may be locked or inaccessible.' }), { status: 500 });
    }
    
    // Parse frontmatter - handle both \n and \r\n line endings
    const lines = content.split(/\r?\n/);
    
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

    const frontmatterLines = lines.slice(1, frontmatterEndLine);
    const bodyContent = lines.slice(frontmatterEndLine + 1).join('\n').trim();

    // Parse YAML frontmatter
    const frontmatter: any = { slug };
    
    for (let i = 0; i < frontmatterLines.length; i++) {
      const line = frontmatterLines[i];
      if (!line.trim() || line.trim().startsWith('#')) continue;
      
      // Check if this is a simple key-value pair (not an array element)
      if (!line.startsWith(' ') && !line.startsWith('\t')) {
        // Check if this line starts an array
        if (line.startsWith('ingredients:') || line.startsWith('instructions:')) {
          const { items, endIdx } = parseYamlArray(frontmatterLines, i);
          const key = line.split(':')[0];
          frontmatter[key] = items;
          i = endIdx;
        } else {
          // Regular key-value pair
          const match = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
          if (match) {
            let [, key, value] = match;
            value = value.trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            // Parse numbers
            if (!isNaN(Number(value)) && value !== '') {
              frontmatter[key] = Number(value);
            } else if (value === 'true') {
              frontmatter[key] = true;
            } else if (value === 'false') {
              frontmatter[key] = false;
            } else {
              frontmatter[key] = value;
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      slug,
      ...frontmatter,
      body: bodyContent
    }));

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new Response(JSON.stringify({ error: 'Recipe file not found' }), { status: 404 });
    }
    console.error('Read error:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred while reading the recipe' }), { status: 500 });
  }
};
