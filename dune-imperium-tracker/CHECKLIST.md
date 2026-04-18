# Deployment & Sync Checklist

To ensure every change you make locally is successfully pushed to GitHub (and subsequently deployed to Firebase via your GitHub Actions Workflow), follow this checklist:

## 1. Verify Local Application Works
- [ ] Run `npm run dev` to start your local server.
- [ ] Test the UI in your browser to verify your recent changes work as expected.
- [ ] Check the browser console (F12) for any errors. 

## 2. Clean Up Clutter (Optional but Recommended)
- [ ] Check for duplicate files or accidentally dragged files (e.g. if `App.jsx` was accidentally copied to the root folder, delete the root duplicate and keep only the one in `src/components/`).
- [ ] Ensure formatting is clean.

## 3. Sync to GitHub
You can use any of the three methods below to sync your files. All methods do the exact same thing behind the scenes.

**Method A: Using NPM (Newest & Easiest)**
- [ ] Run `npm run sync` in your terminal.
*(This automatically adds all changes, creates a commit, and pushes to `origin main`)*

**Method B: Using your Batch Script**
- [ ] Double-click the `push_changes.bat` file in your workspace.

**Method C: Manual Git Commands**
- [ ] Run `git add .`
- [ ] Run `git commit -m "Description of what I changed"`
- [ ] Run `git push origin main`

## 4. Verify the Deployment
- [ ] Go to your GitHub Repository: https://github.com/ztyk92/dune-uprising-tracker
- [ ] Check the **Actions** tab to ensure the Deployment to Firebase has started.
- [ ] Wait for the action to turn Green (Success).
- [ ] Open your live Firebase site URL and hit **Ctrl + F5** (Hard Refresh) to see the live updates.
