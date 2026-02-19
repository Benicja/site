-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_image TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Enforce one comment per user per recipe
  UNIQUE(recipe_id, user_id),
  
  -- Index for faster queries
  CONSTRAINT comment_length CHECK (LENGTH(content) <= 500)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments (public read)
CREATE POLICY "Comments are publicly readable"
  ON comments FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments"
  ON comments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()::text
  );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()::text
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()::text
  );

-- Policy: Users can delete their own comments, admins can delete any
CREATE POLICY "Users can delete their own comments, admins can delete any"
  ON comments FOR DELETE
  USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM approved_users
        WHERE email = (SELECT email FROM user_sessions WHERE id::text = auth.uid()::text)
        AND role = 'admin'
      )
    )
  );

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_update_timestamp ON comments;
CREATE TRIGGER comments_update_timestamp
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_timestamp();
-- Create comment_hearts table
CREATE TABLE IF NOT EXISTS comment_hearts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate hearts
  UNIQUE(comment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_hearts_comment_id ON comment_hearts(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_hearts_user_id ON comment_hearts(user_id);

-- Enable RLS on comment_hearts
ALTER TABLE comment_hearts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read hearts (public)
CREATE POLICY "Comment hearts are publicly readable"
  ON comment_hearts FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own hearts
CREATE POLICY "Users can heart comments"
  ON comment_hearts FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()::text
  );

-- Policy: Users can remove their own hearts
CREATE POLICY "Users can unheart comments"
  ON comment_hearts FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()::text
  );