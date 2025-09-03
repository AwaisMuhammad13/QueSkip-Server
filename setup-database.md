# Database Setup Guide

## Option 1: Supabase (Recommended)

1. **Sign up at [Supabase](https://supabase.com)**
   - Use your GitHub account for easy signup

2. **Create a new project**
   - Project name: `QueSkip`
   - Database password: Choose a strong password
   - Region: Choose closest to your users

3. **Get connection details**
   - Go to Settings → Database
   - Copy the connection string
   - It looks like: `postgresql://postgres.xyz:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

4. **Update your .env file**
   ```
   DATABASE_URL=postgresql://postgres.xyz:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   DB_HOST=aws-0-us-east-1.pooler.supabase.com
   DB_PORT=6543
   DB_NAME=postgres
   DB_USER=postgres.xyz
   DB_PASSWORD=[YOUR_PASSWORD]
   ```

5. **Run the schema**
   - In Supabase dashboard, go to SQL Editor
   - Copy the contents of `scripts/schema-corrected.sql`
   - Run it to create your tables

## Option 2: Railway

1. **Sign up at [Railway](https://railway.app)**
2. **Create new project**
3. **Add PostgreSQL service**
4. **Copy connection variables from Railway dashboard**

## Option 3: Local PostgreSQL (Development)

1. **Install PostgreSQL**
   - Windows: Download from postgresql.org
   - Use pgAdmin for management

2. **Create database**
   ```sql
   CREATE DATABASE queskip_db;
   ```

3. **Keep current .env settings** (already configured for local)

## Testing the Connection

After setting up, build and start your server:

```bash
npm run build
npm start
```

You should see: "Connected to PostgreSQL database successfully"
