-- Allow recipe_id to be NULL for album comments
-- Change recipe_id from NOT NULL to nullable

ALTER TABLE comments ALTER COLUMN recipe_id DROP NOT NULL;
