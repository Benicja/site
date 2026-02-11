import { z, defineCollection } from 'astro:content';

const recipeCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featured_image: z.string().optional(),
    prep_time: z.number(),
    cook_time: z.number(),
    servings: z.number(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    category: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer']),
    ingredients: z.array(z.object({
      item: z.string(),
      amount: z.string()
    })),
    instructions: z.array(z.object({
      step: z.string()
    })),
    tags: z.array(z.enum(['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Quick', 'Make-Ahead', 'Holiday'])).optional(),
    notes: z.string().optional(),
    publishDate: z.date().optional(),
    draft: z.boolean().optional()
  })
});

export const collections = {
  'recipes': recipeCollection,
};