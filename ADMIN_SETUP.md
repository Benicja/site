# Setting Up Admin Access

This guide walks you through enabling the admin interface at `/admin` to manage recipes.

## Step 1: Push Changes to GitHub

```bash
git add .
git commit -m "Set up Decap CMS admin interface"
git push origin main
```

## Step 2: Enable Netlify Identity

1. **Go to your Netlify site dashboard** at [app.netlify.com](https://app.netlify.com/)
2. Navigate to **Site Settings** > **Identity**
3. Click **Enable Identity**

## Step 3: Enable Git Gateway

1. In the Identity section, scroll to **Services**
2. Click **Enable Git Gateway**
3. This allows the CMS to commit changes to your GitHub repository

## Step 4: Set Registration Preferences (Important!)

1. In Identity settings, go to **Registration** section
2. Change registration from "Open" to **"Invite only"**
3. This prevents unauthorized users from creating accounts

## Step 5: Invite Yourself as Admin

1. In the Identity section, click **Invite users**
2. Enter your email address
3. Check your email for the invitation link
4. Click the link and set your password

## Step 6: Access the Admin Interface

1. Visit **https://benicja.com/admin** (or your Netlify URL)
2. Click **"Login with Netlify Identity"**
3. Enter your email and password
4. You're now in the admin interface! 🎉

## Using the Admin Interface

### Adding a Recipe
1. Click **"New Recipes"** in the admin dashboard
2. Fill in all the recipe fields:
   - Title, description, category
   - Prep time, cook time, servings
   - Ingredients (click "Add ingredients" for each)
   - Instructions (click "Add instructions" for each step)
   - Upload an optional featured image
   - Add tags for filtering
3. Click **"Publish"** (or "Save as draft")

### Editing a Recipe
1. Click on any recipe in the list
2. Make your changes
3. Click **"Publish"** to save

### Uploading Images
- When editing a recipe, click the image field
- Upload an image from your computer
- Images are saved to `public/images/recipes/`

### Editorial Workflow
- **Draft**: Save without publishing
- **In Review**: Mark for review before publishing  
- **Ready**: Publish to the live site

## Troubleshooting

### Can't log in?
- Make sure you've accepted the email invitation
- Check that Identity is enabled in Netlify dashboard
- Verify Git Gateway is enabled

### Changes not appearing?
- Netlify auto-deploys when changes are pushed to GitHub
- The CMS commits directly to your repository
- Check the Netlify deploy log for any errors

### Want to add more admins?
1. Go to Netlify Dashboard > Identity
2. Click "Invite users"
3. Send invitation to their email

## Security Notes

- Never share your admin login credentials
- Keep registration set to "Invite only"
- Regularly review who has Identity access
- You can revoke user access from the Netlify dashboard

## Next Steps

Once the admin is set up, you can:
- Add all your favorite recipes
- Upload recipe photos
- Organize recipes by category and tags
- Draft recipes and publish when ready

---

**Need help?** Check the [Decap CMS documentation](https://decapcms.org/docs/intro/) for advanced features.
