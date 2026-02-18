import { parse, stringify } from 'yaml';

export interface RecipeData {
  title: string;
  description: string;
  featured_image?: string;
  prep_time: number;
  cook_time: number;
  servings?: number;
  category: string;
  ingredients: Array<{ item: string; amount: string }>;
  instructions: Array<{ step: string }>;
  publishDate?: string;
  draft?: boolean;
}

/**
 * Build valid YAML frontmatter using the yaml library
 * This ensures proper escaping and formatting without manual string concatenation
 */
export function buildRecipeFrontmatter(recipe: RecipeData): string {
  const frontmatter = {
    title: recipe.title,
    description: recipe.description,
    ...(recipe.featured_image && { featured_image: recipe.featured_image }),
    prep_time: recipe.prep_time || 0,
    cook_time: recipe.cook_time || 0,
    ...(recipe.servings && { servings: recipe.servings }),
    category: recipe.category || 'Other',
    ...(recipe.ingredients && recipe.ingredients.length > 0 && { ingredients: recipe.ingredients }),
    ...(recipe.instructions && recipe.instructions.length > 0 && { instructions: recipe.instructions }),
    publishDate: recipe.publishDate || new Date().toISOString().split('T')[0],
    ...(recipe.draft !== undefined && { draft: recipe.draft })
  };

  // Use yaml library to stringify - this handles all escaping automatically
  const yamlString = stringify(frontmatter, {
    lineWidth: -1, // Don't break long lines
    indent: 2
  });

  return `---\n${yamlString}---\n\n`;
}

/**
 * Validate that a recipe YAML is valid
 * Returns null if valid, or error message if invalid
 */
export function validateRecipeYAML(content: string): string | null {
  try {
    // Extract frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      return 'Missing YAML frontmatter delimiters (---)';
    }

    const yamlContent = match[1];

    // Try to parse the YAML
    const parsed = parse(yamlContent);

    // Validate required fields
    const required = ['title', 'description', 'category', 'prep_time', 'cook_time'];
    for (const field of required) {
      if (!(field in parsed)) {
        return `Missing required field: ${field}`;
      }
    }

    // Validate types
    if (typeof parsed.title !== 'string') return 'title must be a string';
    if (typeof parsed.description !== 'string') return 'description must be a string';
    if (typeof parsed.category !== 'string') return 'category must be a string';
    if (typeof parsed.prep_time !== 'number') return 'prep_time must be a number';
    if (typeof parsed.cook_time !== 'number') return 'cook_time must be a number';

    // Validate ingredients array
    if (parsed.ingredients) {
      if (!Array.isArray(parsed.ingredients)) {
        return 'ingredients must be an array';
      }
      for (const ing of parsed.ingredients) {
        if (typeof ing.item !== 'string' || typeof ing.amount !== 'string') {
          return 'Each ingredient must have "item" and "amount" strings';
        }
      }
    }

    // Validate instructions array
    if (parsed.instructions) {
      if (!Array.isArray(parsed.instructions)) {
        return 'instructions must be an array';
      }
      for (const ins of parsed.instructions) {
        if (typeof ins.step !== 'string') {
          return 'Each instruction must have a "step" string';
        }
      }
    }

    return null; // Valid
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `YAML parse error: ${message}`;
  }
}
