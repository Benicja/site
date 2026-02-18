import type { APIRoute } from 'astro';
import { isUserAdmin, SESSION_COOKIE } from '../../../lib/auth';
import { commitToGitHub } from '../../../lib/github';
import path from 'path';
import crypto from 'crypto';

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

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Recipe slug required' }), { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'File must be an image' }), { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'Image must be smaller than 5MB' }), { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const filename = `${slug}-${timestamp}-${random}.${ext}`;
    const filePath = path.join('public', 'images', 'recipes', filename);

    // Convert file to buffer and write to GitHub
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      await commitToGitHub(filePath, buffer, `Upload image for recipe: ${slug}`);
    } catch (uploadError: any) {
      console.error('Failed to commit image to GitHub:', uploadError);
      return new Response(JSON.stringify({ error: `Could not save image: ${uploadError.message}` }), { status: 500 });
    }

    // Return the public URL
    const publicUrl = `/images/recipes/${filename}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      filename
    }));

  } catch (error: any) {
    console.error('Image upload error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to upload image' }), { status: 500 });
  }
};
