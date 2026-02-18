/**
 * Simple client-side cache to optimistically show recipe changes
 * before the static site rebuild completes on Netlify.
 */

export const RECIPE_CACHE_PREFIX = 'recipe_pending_v1_';
export const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface CachedRecipe {
  timestamp: number;
  data: {
    title: string;
    description: string;
    category: string;
    prep_time: number;
    cook_time: number;
    servings: number;
    featured_image?: string;
    ingredients: Array<{ item: string; amount: string }>;
    instructions: Array<{ step: string }>;
  };
}

export function saveRecipeToCache(slug: string, data: CachedRecipe['data']) {
  if (typeof window === 'undefined') return;
  
  const cacheData: CachedRecipe = {
    timestamp: Date.now(),
    data
  };
  localStorage.setItem(RECIPE_CACHE_PREFIX + slug, JSON.stringify(cacheData));
}

export function getCachedRecipe(slug: string): CachedRecipe | null {
  if (typeof window === 'undefined') return null;
  
  const raw = localStorage.getItem(RECIPE_CACHE_PREFIX + slug);
  if (!raw) return null;
  
  try {
    const cached = JSON.parse(raw) as CachedRecipe;
    // Expire after 10 minutes
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(RECIPE_CACHE_PREFIX + slug);
      return null;
    }
    return cached;
  } catch (e) {
    return null;
  }
}

export function clearRecipeFromCache(slug: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RECIPE_CACHE_PREFIX + slug);
}

// Simple IndexedDB helper for image blobs to bypass Netlify build time for images
const DB_NAME = 'recipe-image-cache';
const STORE_NAME = 'images';

async function openImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveImageToLocalCache(url: string, blob: Blob): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await openImageDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, url);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Failed to save image to IndexedDB:', e);
  }
}

export async function getLocalCachedImage(url: string): Promise<string | null> {
  if (typeof window === 'undefined' || !url) return null;
  try {
    const db = await openImageDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(url);
      request.onsuccess = () => {
        if (request.result instanceof Blob) {
          resolve(URL.createObjectURL(request.result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}
