-- Add album_id column to comments table to support album comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS album_id TEXT;

-- Update indexes to support album comments
CREATE INDEX IF NOT EXISTS idx_comments_album_id ON comments(album_id);

-- Note: The existing comments table structure works for both recipe and album comments
-- Comments will have either recipe_id OR album_id set, but not both
