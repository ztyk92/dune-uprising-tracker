# Deployment Guide (Firebase)

Your application is configured to deploy to **Firebase Hosting** (Frontend) and **Cloud Functions** (Backend).
The backend logic has been moved to `functions/server.js`.

## Prerequisites

1.  **Install Firebase CLI**: `npm install -g firebase-tools`
2.  **Login**: `firebase login`

## Deployment Steps

1.  **Build the Project**
    ```bash
    npm install
    npm run build
    ```
    This creates the `dist` folder which Firebase Hosting serves.

2.  **Install Functions Dependencies**
    ```bash
    cd functions
    npm install
    cd ..
    ```

3.  **Set Environment Variables**
    Since your `server.js` needs `GOOGLE_CREDENTIALS`, you must set this in the Cloud Function environment.
    
    *Generate a stringified version of your `credentials.json`:*
    ```bash
    # (PowerShell)
    $json = Get-Content credentials.json -Raw
    $json = $json -replace '"', '\"' # Escape quotes if needed, or just copy-paste carefully
    ```
    
    *Ideally, copy the content of `credentials.json` (minify it to one line first) and run:*
    ```bash
    firebase functions:secrets:set GOOGLE_CREDENTIALS
    # Paste the JSON content when prompted
    ```
    
    *Update `functions/index.js` to use secrets if sticking to V2 Functions standard, OR simpler for now:*
    Set it as a config variable (V1 style) or just include `credentials.json` in the upload (less secure but easiest for `credentials.json` file presence).
    
    **Easiest Path (File Upload)**:
    Ensure `credentials.json` is **NOT** in `.gitignore` for the `functions` folder deploy context, or copy it to `functions/credentials.json`.
    
    ```bash
    copy credentials.json functions/credentials.json
    ```

4.  **Deploy**
    ```bash
    firebase deploy
    ```

## Troubleshooting
- **"Error: missing credentials.json"**: Ensure `credentials.json` exists in the `functions` directory or is correctly passed as an environment variable.
- **500 Errors**: Check the Google Cloud Console logs for the `api` function.
