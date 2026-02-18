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
