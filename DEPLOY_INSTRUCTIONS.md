# Deploy to Netlify - Quick Instructions

## Option 1: Drag & Drop (Fastest)
1. Open Netlify Drop: https://app.netlify.com/drop
2. Drag the entire `ct-gaming-directory` folder onto the page
3. Your site will be live in seconds!

## Option 2: GitHub Integration
1. Create a new repo on GitHub
2. Push this code to GitHub:
   ```bash
   git remote add origin https://github.com/builtbytom/ct-gaming-directory.git
   git push -u origin main
   ```
3. In Netlify:
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select the repository
   - Deploy settings are already configured in netlify.toml

## Option 3: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

The site is production-ready with:
- Gaming-themed dark UI
- 10 sample stores
- Search bar and filters
- Mobile responsive design
- Store cards with ratings and game badges