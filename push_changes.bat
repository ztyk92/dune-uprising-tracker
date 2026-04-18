@echo off
cd /d "%~dp0"
cd dune-imperium-tracker

echo Pushing source code changes to GitHub...
git add .
git commit -m "Auto-deploy: Update from local environment"
git push origin main

echo Done! GitHub Actions will now build and deploy the app to Firebase.
