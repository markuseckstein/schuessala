# Deploying to GitHub Pages

This app is configured to deploy to GitHub Pages. There are two methods:

## Method 1: Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically builds and deploys the app when you push to the `main` branch.

### Setup Steps:

1. **Merge your feature branch to main**:
   ```bash
   git checkout main
   git merge claude/schafkopf-app-design-011CUe5iYexqzpt6FoytUgXo
   git push origin main
   ```

2. **Enable GitHub Pages in Repository Settings**:
   - Go to your GitHub repository
   - Click **Settings** → **Pages**
   - Under "Source", select **GitHub Actions**
   - Click **Save**

3. **Wait for deployment**:
   - Go to the **Actions** tab in your repository
   - Watch the "Deploy to GitHub Pages" workflow run
   - Once complete, your app will be live at:
     ```
     https://markuseckstein.github.io/schuessala/
     ```

4. **Enable HTTPS (Important for WebRTC)**:
   - GitHub Pages automatically serves over HTTPS
   - WebRTC requires HTTPS in production
   - Your app will work at the URL above!

## Method 2: Manual Deployment

If you prefer to deploy manually from your local machine:

### Setup Steps:

1. **Install dependencies** (if not already):
   ```bash
   npm install
   ```

2. **Build and deploy**:
   ```bash
   npm run deploy
   ```

   This command:
   - Builds the production version
   - Pushes the `dist/` folder to the `gh-pages` branch

3. **Enable GitHub Pages** (if not already enabled):
   - Go to your GitHub repository
   - Click **Settings** → **Pages**
   - Under "Source", select **Deploy from a branch**
   - Select branch: `gh-pages` and folder: `/ (root)`
   - Click **Save**

4. **Access your app**:
   ```
   https://markuseckstein.github.io/schuessala/
   ```

## Testing Locally Before Deployment

Always test the production build locally before deploying:

```bash
npm run build
npm run preview
```

Open the URL shown (usually `http://localhost:4173`) to test the production build.

## Troubleshooting

### WebRTC not working
- Ensure you're accessing the app via HTTPS (GitHub Pages does this automatically)
- Check browser console for errors
- Some restrictive networks may block WebRTC connections

### 404 errors on refresh
- This is expected with hash-based routing
- Users should always start from the home page
- Bookmark: `https://markuseckstein.github.io/schuessala/`

### Build fails
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version (requires Node 18+): `node --version`

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `public/` directory with your domain:
   ```
   echo "yourdomain.com" > public/CNAME
   ```

2. Configure DNS records with your domain provider:
   - Add A records pointing to GitHub Pages IPs
   - Or add a CNAME record pointing to `markuseckstein.github.io`

3. Rebuild and deploy

See [GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for details.

## Continuous Deployment

After initial setup with Method 1, every push to `main` will automatically:
- Build the app
- Run tests (if added)
- Deploy to GitHub Pages
- Update your live site within 1-2 minutes

Happy deploying! 🚀
