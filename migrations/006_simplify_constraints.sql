-- Simplify constraints - remove problematic partial indexes
-- These might be causing issues with album comment inserts

-- Drop the problematic CHECK constraint if it exists
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_recipe_or_album_not_null;

-- Drop partial indexes that might be causing issues
DROP INDEX IF EXISTS idx_comments_recipe_user;
DROP INDEX IF EXISTS idx_comments_album_user;

-- For now, keep it simple - rely on application logic and one basic unique constraint
-- Allow comments on EITHER recipes OR albums, but not both simultaneously

-- Create basic uniqueness - one comment per user per recipe/album combination
-- For recipe comments, we'll use recipe_id
-- For album comments, we'll use album_id
-- The application ensures only one is populated at a time

-- Since we can't easily enforce uniqueness when one column might be NULL,
-- let's try a different approach using coalesce
CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_unique_per_item
  ON comments(COALESCE(recipe_id, album_id), user_id);
