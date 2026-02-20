# Album Comments - Database Migrations Required

The album comments feature requires several database migrations to be applied to your Supabase database. Since migration 001 was completed (recipe comments work), you need to apply migrations 002-006.

## ⚠️ Important: Manual Application Required

These migrations are **not automatically applied** - you must manually run them in Supabase's SQL Editor.

## 📋 Migrations to Apply (in order):

### 1. Migration 002: Add Comment Tracking (soft deletes)
**File**: `/migrations/002_add_comment_tracking.sql`
- Adds `deleted_at` column for soft-delete support
- Allows tracking abuse prevention

### 2. Migration 003: Add Album Comments Support
**File**: `/migrations/003_add_album_comments.sql`
- **REQUIRED**: Adds the `album_id` column to the comments table
- This is critical - without it, album comments will fail with "column not found"

### 3. Migration 004: Fix Comment Constraints
**File**: `/migrations/004_fix_comment_constraints.sql`
- Adds CHECK constraints to enforce either recipe_id OR album_id
- Adds partial unique indexes for both recipe and album comments

### 4. Migration 005: Update RLS Policies (Optional)
**File**: `/migrations/005_update_rls_for_album_comments.sql`
- Ensures RLS policies work correctly for both recipe and album comments

### 5. Migration 006: Simplify Constraints (Recommended)
**File**: `/migrations/006_simplify_constraints.sql`
- Simplifies unique indexes if you hit constraint violations
- Use this if migrations 004-005 cause issues

## 🚀 Steps to Apply:

1. **Open Supabase Dashboard for your project**
   - Go to: https://app.supabase.com/
   - Select your benicja project

2. **Navigate to SQL Editor**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"** button

3. **For EACH migration file (in order):**
   - Open the migration file from the repo
   - Copy the entire SQL contents
   - Paste into the Supabase SQL editor
   - Click **"Execute"** button
   - Wait for success message

4. **Test Album Comments**
   - Navigate to an album page
   - Try posting a comment
   - You should see the "Failed to create comment" error disappear

## ✅ Verification Checklist

After applying all migrations, verify with a query in Supabase SQL Editor:

```sql
-- Check if album_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'comments' AND column_name = 'album_id';
-- Should return: album_id (text)

-- Check if constraints exist
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'comments';
-- Should include comments_recipe_or_album_not_null
```

## 🐛 Troubleshooting

**If you get an error applying migrations:**
1. Try running them one at a time
2. If migration 004 fails, skip to migration 006
3. Check that migration 001 was already applied (comments table must exist)

**If album comments still fail after applying migrations:**
1. Check the browser console error message (should now show more details)
2. Create an issue with the complete error message

---

Would you like me to help you apply these migrations?
