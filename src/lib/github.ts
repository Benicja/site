import { promises as fs } from 'fs';
import path from 'path';

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO; // e.g. "owner/repo"
const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH || 'main';

/**
 * Reads a file from GitHub or local file system.
 */
export async function readFromGitHub(filePath: string) {
  // If we're local and NO github token is found, fallback to local file system
  if (import.meta.env.DEV && !GITHUB_TOKEN) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  // Ensure GITHUB_TOKEN and GITHUB_REPO are set for production or forced GitHub mode
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO must be set for production reads');
  }

  // Normalize path for GitHub
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${relativePath}?ref=${GITHUB_BRANCH}`;

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw', // Request raw content directly
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${relativePath}`);
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`GitHub Read API Error: ${errorData.message || 'Unknown error'}`);
  }

  return await response.text();
}

/**
 * Commits a file directly to GitHub.
 * Works on read-only filesystems (like Netlify) where fs.writeFile fails.
 */
export async function commitToGitHub(filePath: string, content: string | Buffer, message: string) {
  // If we're local and NO github token is found, fallback to local file system
  if (import.meta.env.DEV && !GITHUB_TOKEN) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    
    // Ensure parent directory exists
    const dirname = path.dirname(fullPath);
    await fs.mkdir(dirname, { recursive: true });
    
    await fs.writeFile(fullPath, content);
    return { success: true, method: 'local' };
  }

  // Ensure GITHUB_TOKEN and GITHUB_REPO are set for production or forced GitHub mode
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO must be set for production commits');
  }

  // Normalize path for GitHub (no leading slash, use forward slashes)
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${relativePath}`;

  // 1. Get current file SHA if it exists
  let sha: string | undefined;
  try {
    const getResponse = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (getResponse.ok) {
      const data = (await getResponse.json()) as any;
      sha = data.sha;
    }
  } catch (error) {
    // Ignore error, assume new file
  }

  // 2. Prepare content (handle string vs buffer)
  const base64Content = typeof content === 'string' 
    ? Buffer.from(content).toString('base64') 
    : content.toString('base64');

  // 3. Commit the content (create or update)
  const commitResponse = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: base64Content,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!commitResponse.ok) {
    const errorData = await commitResponse.json();
    console.error('GitHub API Error:', errorData);
    throw new Error(`GitHub API Error: ${errorData.message || 'Unknown error'}`);
  }

  return { success: true, method: 'github', sha: (await commitResponse.json()).content.sha };
}

/**
 * Deletes a file from GitHub.
 */
export async function deleteFromGitHub(filePath: string, message: string) {
  // If we're local and NO github token is found, fallback to local file system
  if (import.meta.env.DEV && !GITHUB_TOKEN) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    try {
      await fs.unlink(fullPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
    return { success: true, method: 'local' };
  }

  // Ensure GITHUB_TOKEN and GITHUB_REPO are set
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO must be set for production deletes');
  }

  // Normalize path for GitHub
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${relativePath}`;

  // 1. Get current file SHA (required for deletion)
  let sha: string;
  try {
    const getResponse = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      if (getResponse.status === 404) return { success: true, alreadyDeleted: true };
      throw new Error(`Failed to get file SHA for deletion: ${getResponse.statusText}`);
    }

    const data = (await getResponse.json()) as any;
    sha = data.sha;
  } catch (error: any) {
    throw new Error(`GitHub Delete failed (SHA fetch): ${error.message}`);
  }

  // 2. Delete the file
  const deleteResponse = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!deleteResponse.ok) {
    const errorData = await deleteResponse.json();
    throw new Error(`GitHub Delete API Error: ${errorData.message || 'Unknown error'}`);
  }

  return { success: true, method: 'github' };
}
