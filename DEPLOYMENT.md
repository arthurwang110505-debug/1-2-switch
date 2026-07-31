# 1-2-Switch Party Game - Deployment Guide

## Architecture
This game has two parts that must be deployed separately:
1. **Frontend (Vercel)** — Static React app
2. **Backend (Railway/Render/your server)** — Socket.io server with persistent connections

Socket.io WebSocket connections CANNOT run on Vercel serverless functions (they time out after 60s and are stateless).

## Step 1: Deploy the Backend Server

### Option A: Railway (Recommended - Free tier available)
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repo
4. Railway will auto-detect Node.js and use `npm start` (which runs `dist/server.cjs`)
5. Copy the generated URL (e.g., `https://your-app.up.railway.app`)

### Option B: Render (Free tier available)
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: None needed
5. Deploy

### Option C: Self-hosted (VPS / DigitalOcean / etc.)
```bash
git clone <repo>
npm install
npm run build
npm start
```

## Step 2: Update Frontend to Connect to Backend

### If you used Option A or B (Railway/Render):
Add a `.env.production` file (or set as Vercel environment variable):

```env
VITE_SOCKET_URL=https://your-backend.up.railway.app
```

Or add it in Vercel Dashboard → Project Settings → Environment Variables:
- Key: `VITE_SOCKET_URL`
- Value: `https://your-backend.up.railway.app`

### If deploying to custom domain:
```env
VITE_SOCKET_URL=https://socket.yourdomain.com
```

## Step 3: Deploy Frontend to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for auto-deployment.

## Local Development

```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend dev server (will proxy /socket.io to backend)
npm run dev -- --mode development
```

Actually, this project uses a single `npm run dev` that starts the backend. The frontend dev server is Vite with proxy config. To run both:

```bash
# Start backend (and frontend dev with proxy)
npm run dev
```

The Vite proxy in `vite.config.ts` will forward `/socket.io` requests to `http://localhost:3000`.

## Troubleshooting

### "WebSocket connection failed: 404"
This means the backend Socket.io server is not running or unreachable. Check:
1. Is the backend deployed and running?
2. Is `VITE_SOCKET_URL` set correctly?
3. Is CORS enabled on the backend? (The server already has `cors: { origin: '*' }`)

### "Cannot connect to server"
- Verify the backend URL is accessible from your browser
- Check browser console for CORS errors
- Make sure the backend server started successfully (check logs)

### QR code not working on mobile
- The backend must be publicly accessible (https://...)
- Mobile devices cannot reach `localhost`
- Use ngrok for testing: `ngrok http 3000`
