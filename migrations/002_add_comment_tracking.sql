-- Add deleted_at column to comments table to track deletions for abuse prevention
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create a view to check if a user has previously deleted a comment on a recipe
CREATE OR REPLACE VIEW user_deleted_comments AS
SELECT DISTINCT user_id, recipe_id
FROM comments
WHERE deleted_at IS NOT NULL;
