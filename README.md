# Expense Tracker

A full-stack expense tracker with:

- React + Vite frontend
- Express + MongoDB backend
- JWT auth
- expense CRUD
- monthly budgeting with month-to-month comparison

## Local Development

### Backend

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in `MONGO_URI` and `JWT_SECRET`
3. Run:

```powershell
cd backend
npm install
npm run dev
```

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env`
2. For local development, the default value is:

```env
VITE_API_URL=http://localhost:5000/api
```

3. Run:

```powershell
cd frontend
npm install
npm run dev
```

## Deployment Prep

This project is ready for a split deployment:

- frontend on Vercel
- backend on Render
- database on MongoDB Atlas

### Backend environment variables

- `MONGO_URI`
- `JWT_SECRET`
- `PORT`
- `CLIENT_URLS`

Example:

```env
CLIENT_URLS=https://your-frontend-domain.vercel.app
```

You can also allow multiple origins by comma-separating them.

### Frontend environment variables

- `VITE_API_URL`

Example:

```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

### Suggested deploy settings

#### Render backend

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

#### Vercel frontend

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

## Health Check

The backend exposes:

```text
/api/health
```

which returns a simple JSON health response for deployment checks.
