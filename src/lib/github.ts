import { promises as fs } from 'fs';
import path from 'path';

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
let GITHUB_REPO = import.meta.env.GITHUB_REPO; // e.g. "owner/repo"
const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH || 'main';

// Sanitize GITHUB_REPO if it's a full URL
if (GITHUB_REPO && GITHUB_REPO.includes('github.com/')) {
  GITHUB_REPO = GITHUB_REPO.split('github.com/')[1].split('?')[0].split('#')[0];
  if (GITHUB_REPO.endsWith('.git')) GITHUB_REPO = GITHUB_REPO.slice(0, -4);
}

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
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }
  if (!GITHUB_REPO) {
    throw new Error('GITHUB_REPO environment variable is not set (should be "owner/repo")');
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
    let msg = errorData.message || 'Unknown error';
    if (response.status === 403 && msg.includes('personal access token')) {
      msg = `${msg}. Ensure your PAT has "Contents: Read" permission and is authorized for this repository (and has SSO enabled if using an organization).`;
    }
    throw new Error(`GitHub Read API Error (${response.status}): ${msg}`);
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
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }
  if (!GITHUB_REPO) {
    throw new Error('GITHUB_REPO environment variable is not set (should be "owner/repo")');
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
    } else {
        const errorData = await getResponse.json().catch(() => ({}));
        if (getResponse.status === 403 && (errorData.message || '').includes('personal access token')) {
            throw new Error(`GitHub Auth Error (${getResponse.status}): ${errorData.message}. Ensure your token has "Contents: Read" permission.`);
        }
    }
  } catch (error: any) {
    if (error.message.includes('GitHub Auth Error')) throw error;
    // Ignore other errors, assume new file
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
    const errorData = await commitResponse.json().catch(() => ({ message: commitResponse.statusText }));
    console.error('GitHub API Error:', errorData);
    let msg = errorData.message || 'Unknown error';
    if (commitResponse.status === 403 && msg.includes('personal access token')) {
      msg = `${msg}. ACTION REQUIRED: 1. Ensure your PAT has "Contents: Write" permission. 2. Ensure your PAT is authorized for this repository. 3. If using an organization, ensure SAML SSO is authorized for the token.`;
    }
    throw new Error(`GitHub API Error (${commitResponse.status}): ${msg}`);
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
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }
  if (!GITHUB_REPO) {
    throw new Error('GITHUB_REPO environment variable is not set (should be "owner/repo")');
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
      
      const errorData = await getResponse.json().catch(() => ({}));
      let msg = errorData.message || getResponse.statusText;
      if (getResponse.status === 403 && msg.includes('personal access token')) {
        msg = `${msg}. Ensure your PAT has "Contents: Read" permission.`;
      }
      throw new Error(`Failed to get file SHA for deletion (${getResponse.status}): ${msg}`);
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
    const errorData = await deleteResponse.json().catch(() => ({ message: deleteResponse.statusText }));
    let msg = errorData.message || 'Unknown error';
    if (deleteResponse.status === 403 && msg.includes('personal access token')) {
      msg = `${msg}. ACTION REQUIRED: Ensure your PAT has "Contents: Write" permission.`;
    }
    throw new Error(`GitHub Delete API Error (${deleteResponse.status}): ${msg}`);
  }

  return { success: true, method: 'github' };
}
