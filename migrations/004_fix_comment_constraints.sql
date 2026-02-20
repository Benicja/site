-- Fix constraints to support both recipe and album comments
-- Drop the existing UNIQUE constraint if it exists
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_recipe_id_user_id_key;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_recipe_user_unique;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_album_user_unique;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_unique_per_item;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_one_per_user_per_item;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_recipe_or_album_not_null;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_comments_recipe_user;
DROP INDEX IF EXISTS idx_comments_album_user;

-- Create a simpler approach: keep the old constraint for backward compatibility
-- and allow both recipe and album comments by requiring at least one to be NOT NULL
ALTER TABLE comments ADD CONSTRAINT comments_recipe_or_album_not_null 
  CHECK (recipe_id IS NOT NULL OR album_id IS NOT NULL);

-- Add separate unique constraints for each type
-- For recipe comments (album_id must be null)
CREATE UNIQUE INDEX idx_comments_recipe_user 
  ON comments(recipe_id, user_id) 
  WHERE album_id IS NULL;

-- For album comments (recipe_id must be null)  
CREATE UNIQUE INDEX idx_comments_album_user 
  ON comments(album_id, user_id) 
  WHERE recipe_id IS NULL;



