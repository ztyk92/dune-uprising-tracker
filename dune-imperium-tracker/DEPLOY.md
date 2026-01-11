# Deployment Guide

This application is configured as a Full Stack Node.js application. The Node.js server (`server.js`) serves the React frontend (built with Vite) and handles API requests to Google Sheets.

## Recommended Host: Render.com (or Railway/Heroku)

This guide assumes you are using **Render**, but the steps are similar for other Node.js hosting providers.

### 1. Prerequisites
- Push your code to a GitHub repository.
- Have your `credentials.json` file ready (content needed).

### 2. Create a Web Service
1. Go to your Render Dashboard and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 3. Environment Variables
You MUST set the following Environment Variables in the "Environment" tab of your service settings.

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Tells the app to run in production mode and serve static files. |
| `GOOGLE_CREDENTIALS` | *[Paste Content]* | **Crucial**: Paste the ENTIRE content of your `credentials.json` file here. It should look like `{"type": "service_account", ...}`. |

> **Note**: Do not upload `credentials.json` to GitHub. The application is configured to look for the `GOOGLE_CREDENTIALS` environment variable first.

### 4. Deploy
Click **Create Web Service**. Render will:
1. Clone your repo.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the React app into the `dist/` folder.
4. Run `npm start` to launch `server.js`.

Your app will be live at `https://your-service-name.onrender.com`.

## Local Production Test
To test the production build locally before deploying:
1. `npm run build`
2. `set GOOGLE_CREDENTIALS={"type":"service_account"...}` (or just rely on the local `credentials.json` file which works in dev/prod fallback)
3. `set NODE_ENV=production`
4. `npm start`
5. Open `http://localhost:3001` - you should see the built app.
