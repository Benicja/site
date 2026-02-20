-- Update RLS policies to support both recipe and album comments

-- Drop all existing policies
DROP POLICY IF EXISTS "Comments are publicly readable" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments, admins can delete any" ON comments;

-- Policy: Anyone can read comments (public read)
CREATE POLICY "Comments are publicly readable"
  ON comments FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own comments (works for both recipe and album)
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
