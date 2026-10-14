# 🚀 PlaceMate AI - Production Deployment Guide

This guide provides simple, step-by-step instructions to deploy **PlaceMate AI** to production with **free-tier hosting** (Render + Vercel + Supabase/Neon PostgreSQL).

---

## 🏗️ Architecture Overview

| Component | Recommended Host | Free Tier Available? | Setup Time |
| :--- | :--- | :---: | :---: |
| **Frontend (React + Vite)** | **Vercel** or **Netlify** | ✅ Yes | 3 mins |
| **Backend (Node.js Express)** | **Render** or **Railway** | ✅ Yes | 4 mins |
| **Database (PostgreSQL)** | **Neon.tech** or **Supabase** | ✅ Yes | 3 mins |

---

## Step 1: GitHub Repository (Already Pushed!)

Your project is already set up and pushed to GitHub:
`https://github.com/hari-krishnan427/placemate-AI`

Whenever you make future updates locally, just run:
```bash
git add .
git commit -m "your message"
git push origin main
```
*(The root `.gitignore` will automatically prevent `.env` secrets and uploaded student resumes from ever leaking!)*

---

## Step 2: Set Up Free Cloud PostgreSQL (Neon / Supabase)

1. Go to [Neon.tech](https://neon.tech) (or [Supabase](https://supabase.com)).
2. Sign up and click **"Create Project"** (name it `docmind-db`).
3. Copy your **PostgreSQL Connection String**. It looks like this:
   ```
   postgresql://docmind_owner:pass123@ep-cool-fog-12345.ap-southeast-1.neon.tech/docmind_db?sslmode=require
   ```

---

## Step 3: Deploy Backend on Render

1. Go to [Render.com](https://render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `docmind-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add **Environment Variables** in Render's dashboard:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Paste your connection string from Step 2)*
   - `SESSION_SECRET`: *(A random 32+ character string, e.g. `DocMind_Session_Prod_99xK72mP4vL`)*
   - `OTP_SECRET`: *(A random 32+ character string, e.g. `DocMind_OTP_Prod_4nQ81zKp91Lm`)*
   - `GEMINI_API_KEY`: *(Your Google AI Studio API key)*
   - `FRONTEND_URL`: `https://your-frontend.vercel.app` *(You can update this after Step 4)*
   - `EMAIL_USER`: *(Your email for OTP & alerts)*
   - `EMAIL_PASS`: *(Your Gmail 16-character App Password)*
5. Click **Create Web Service**.
6. When deployment finishes, copy your live backend URL (e.g. `https://docmind-backend.onrender.com`).
7. Test it by opening `https://docmind-backend.onrender.com/health` in your browser. You should see `{"status":"ok"}`!

---

## Step 4: Deploy Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `frontend`
4. Add **Environment Variable**:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://docmind-backend.onrender.com` *(Your Render URL from Step 3, without a trailing slash)*
5. Click **Deploy**.
6. Once deployed, copy your live frontend URL (e.g. `https://docmind-ai.vercel.app`).

---

## Step 5: Final Handshake (30 seconds)

1. Return to **Render** → Your backend web service → **Environment Variables**.
2. Update `FRONTEND_URL` to match your actual live Vercel URL:
   `FRONTEND_URL = https://docmind-ai.vercel.app`
3. Render will automatically redeploy with the exact CORS allowed origin!

---

## 🎉 Done!
Your **DocMind AI Career Platform** is now live on the internet, secure, grounded in real student data, and accessible from any phone or laptop in the world!
