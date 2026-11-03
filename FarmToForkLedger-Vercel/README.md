# FarmToFork Ledger - Vercel Deployment Package

This package is pre-configured and ready to be deployed instantly on Vercel.

## Quick Deploy Steps

### Method 1: Vercel Drop (Easiest - Drag & Drop)
1. Open your browser and go to [vercel.com/drop](https://vercel.com/drop) (or log in to your Vercel Dashboard).
2. Drag and drop the `FarmToForkLedger-Vercel.zip` file (or unzip and drop this folder) directly into the browser window.
3. Click **Deploy**.
4. In ~15-30 seconds, your site will be live with a production URL (e.g., `https://your-project.vercel.app`).

### Method 2: Vercel CLI (Optional)
If you have Node.js and Vercel CLI installed:
```bash
npx vercel --prod
```

## Architecture
- **Frontend**: Pre-compiled React SPA located in `public/` (served globally via Vercel Edge CDN).
- **Backend**: Express Serverless Function located in `api/index.js` handling all `/api/*` endpoints (Products CRUD, QR Lookup, Search, Verification, Image Uploads).
- **Routing**: Configured via `vercel.json` with zero-config rewrites.
