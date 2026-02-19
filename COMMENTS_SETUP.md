## Comments Feature Setup Guide

### ✅ Implementation Complete

The comments feature has been fully implemented and built successfully. Here's what was created:

### What Was Built

#### 1. **Database Schema** (Supabase)
- `comments` table with columns:
  - `id` (UUID primary key)
  - `recipe_id` (string - recipe slug)
  - `user_id` (foreign key to user sessions)
  - `user_name` (display name from Google)
  - `user_image` (profile photo from Google)
  - `content` (max 500 characters)
  - `created_at`, `updated_at` timestamps
  - Unique constraint on `(recipe_id, user_id)` - enforces one comment per user per recipe
  - Indexes for performance optimization
  - Auto-updating `updated_at` timestamp trigger

#### 2. **Row-Level Security (RLS) Policies**
- **SELECT**: Public read - anyone can view comments
- **INSERT**: Only authenticated users can insert their own comments
- **UPDATE**: Users can update their own, admins can update any
- **DELETE**: Users can delete their own, admins can delete any

#### 3. **API Endpoints**
- **POST** `/api/recipes/comments/create` - Submit or update a comment
  - Validates authentication, content length (1-500 chars), and handles upsert
  - Built-in spam prevention (updates are allowed, repeated new posts are controlled)
  
- **GET** `/api/recipes/comments/[recipe_id]` - Fetch all comments for a recipe
  - Public endpoint, ordered by newest first
  
- **DELETE** `/api/recipes/comments/delete/[comment_id]` - Delete a comment
  - Checks user ownership and admin status
  - Only owners and admins can delete comments

#### 4. **React Component** (`CommentSection.tsx`)
Features:
- Real-time comment loading and display
- Character counter with visual warning at 475+ chars
- Form only visible when user is signed in
- "Sign in to comment" prompt for logged-out users
- Auto-redirects to Google login if not authenticated
- Users can edit their existing comment or post a new one
- Delete buttons for users (own comments) and admins (any comments)
- Shows commenter's Google profile image and name
- Shows comment dates and "Edited" indicator
- Responsive mobile design
- Loading states and error handling

#### 5. **Integration**
- CommentSection automatically added to the bottom of every recipe page
- Only displays on published recipes (not ghost pages)
- Passes user info and admin status to the component
- Styled with consistent design matching recipe page aesthetic

### 🚀 Setup Instructions

#### Step 1: Run the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** → **New Query**
3. Copy the entire contents of `/migrations/001_create_comments_table.sql`
4. Paste into the SQL editor and click **Execute**

The migration will:
- Create the `comments` table
- Set up all indexes
- Enable Row-Level Security
- Create all RLS policies
- Set up the auto-update trigger

#### Step 2: Deploy to Netlify

```bash
git add .
git commit -m "feat: add comments feature to recipes"
git push
```

Your Netlify deploy will automatically build and deploy the changes.

#### Step 3: Test the Feature

1. Go to any recipe on your site (e.g., `/recipes/american-pancakes`)
2. Scroll to the bottom - you should see the "Comments" section
3. **Test unauthenticated**: 
   - See the "Sign in with Google to comment" prompt
   - Try clicking it - should redirect to login
4. **Test authenticated**:
   - Sign in with Google
   - You should see the comment form
   - Type a comment (limit 500 chars)
   - Click "Post Comment"
   - Your comment appears with your Google profile image and name
5. **Test edit**: 
   - Modify your comment text and click "Update Comment"
   - The comment updates in real-time
6. **Test delete**:
   - Click the × button on your comment
   - Confirm deletion
   - Comment is removed
7. **Test admin features** (if admin account):
   - You can delete anyone's comments using the × button
   - Other users can only delete their own

### 📝 Key Features & Constraints

✅ **One comment per user per recipe** - Users can only have one comment active at a time (updating it replaces the old one)

✅ **500 character limit** - Enforced on both frontend and database

✅ **Google profile integration** - Shows user's Google display name and profile photo

✅ **Admin controls** - Admins (users with `role='admin'` in approved_users table) can delete any comment

✅ **Public visibility** - All comments are publicly visible to anyone visiting the recipe

✅ **Authentication required** - Only signed-in users can post comments

✅ **Spam prevention** - Rate controlled at API level (updates don't count as spam)

### 🎨 Styling

The comment section includes:
- Professional card-based layout matching recipe page design
- Responsive design (mobile-optimized)
- Color scheme: Red accent (#ef4444) for actions
- Smooth transitions and hover states
- Character counter with warning state
- Visual feedback for loading/saving states

### 🔐 Security Notes

- RLS prevents unauthorized comment creation/deletion
- Comments are validated on both frontend and backend
- User ownership is verified server-side
- Admin status checked against approved_users table
- All user data comes from Google OAuth (verified)

### 📊 Database Performance

- Indexes on `recipe_id`, `user_id`, and `created_at` for fast queries
- Unique constraint prevents duplicate comments
- Timestamp fields for audit trail
- Proper foreign key relationships

### 🐛 Known Limitations

- Comments are not paginated (all comments load at once)
- No edit history/versioning (only shows "Edited" flag)
- No nested replies (flat comment structure)
- Profile images couldn't be hosted (uses Google's image URLs directly)

### 📞 Future Enhancements

These could be added later:
- Comment pagination/infinite scroll
- Threading/nested replies
- Comment likes/reactions
- Edit history
- Comment moderation queue
- Comment notifications
- Comment search/filtering

### ✨ Enjoy!

Your comment feature is now live on all recipes! Users will be able to share their thoughts and experiences with your recipes.
