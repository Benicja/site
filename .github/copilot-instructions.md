# Benicja's Kitchen - Development Instructions

## Project Overview
This is a personal family website built with Astro, featuring a recipe collection managed through CloudCannon CMS and a planned private photo gallery synced with Google Photos.

## Tech Stack
- **Frontend:** Astro with React components 
- **Styling:** Tailwind CSS
- **CMS:** CloudCannon for recipe management
- **Authentication:** Google OAuth (planned)
- **Database:** Supabase for user permissions (planned)
- **Deployment:** Netlify

## Development Commands
- `npm run dev` - Start development server (localhost:4321)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Current Status
✅ **Completed:**
- Basic Astro project setup with Tailwind CSS
- CloudCannon configuration and integration  
- Recipe content schema and components
- Responsive recipe pages with sample content
- Homepage and navigation structure

🔄 **In Progress:**
- Gallery page placeholder (coming soon section)
- Basic project structure complete and running

⏳ **Planned:**
- Google OAuth authentication system
- User permission management with Supabase
- Google Photos API integration
- Instagram-style gallery interface
- Photo browsing and comments functionality

## Project Structure
```
src/
├── components/          # Reusable Astro components
│   └── RecipeCard.astro
├── content/
│   ├── config.ts        # Content schema definitions  
│   └── recipes/         # Recipe markdown files
├── layouts/
│   └── Layout.astro     # Main page layout with navigation
├── pages/
│   ├── index.astro      # Homepage
│   ├── recipes/
│   │   ├── index.astro  # Recipe listing page
│   │   └── [slug].astro # Individual recipe pages
│   └── gallery.astro    # Photo gallery (placeholder)
└── data/                # Site configuration data
```

## Content Management
- **Recipes:** Managed through CloudCannon CMS interface
- **Recipe Schema:** Includes title, description, ingredients, instructions, timing, difficulty, tags
- **Manual Addition:** Create `.md` files in `src/content/recipes/` with proper frontmatter

## Next Development Steps
1. **Gallery & Authentication:**
   - Implement Google OAuth integration
   - Set up user permission system with Supabase
   - Create approved user email whitelist

2. **Google Photos Integration:**
   - Connect Google Photos API
   - Build album sync service
   - Create Instagram-style gallery feed

3. **Advanced Features:**
   - Photo browsing with swipe navigation
   - Comment system from Google Photos
   - Search and filtering for recipes
   - Performance optimizations

## Development Guidelines
- All recipe content uses structured data (frontmatter)
- Components designed for CloudCannon compatibility from day one
- Cost-optimized architecture targeting free tier services
- GDPR-compliant email-only data storage
- Mobile-first responsive design

## CloudCannon Integration
- Configuration: `cloudcannon.config.yml`
- Recipe editing through visual CMS interface
- Automatic site rebuilds on content changes
- Image uploads and management through CloudCannon

## Deployment
- **Primary:** Netlify (free tier)
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** (to be added for gallery features)

## Family Access
- **Recipes:** Public access for viewing
- **Gallery:** Private access with Google authentication (planned)
- **Content Management:** CloudCannon admin access only