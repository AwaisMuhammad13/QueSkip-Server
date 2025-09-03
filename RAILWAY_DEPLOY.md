# Railway Deployment Guide

## Step 1: Create New Project in Railway

1. **Login to Railway** (https://railway.app)
2. **Click "New Project"**
3. **Choose "Deploy from GitHub repo"**
4. **Select your repository: `AwaisMuhammad13/QueSkip-Server`**

## Step 2: Add PostgreSQL Database

1. **In your Railway project dashboard:**
   - Click "+ New Service"
   - Select "Database"
   - Choose "PostgreSQL"
   - Railway will automatically provision the database

## Step 3: Configure Environment Variables

Railway will auto-generate database variables. You need to add these additional variables:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret-key-for-production
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-for-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 4: Database Schema Setup

After deployment, run the SQL schema in Railway's database console or connect with a PostgreSQL client.

## Step 5: Domain Setup

Railway will provide a domain like: `queskip-server-production.up.railway.app`

---

## Quick Deploy Checklist:
- [ ] GitHub repo connected
- [ ] PostgreSQL service added
- [ ] Environment variables configured
- [ ] Database schema executed
- [ ] Test API endpoints
