# Deployment: Vercel + Render + Neon

The frontend is a Vite/React app, the API is FastAPI, and PostgreSQL is hosted by Neon. The Render service blueprint is in `render.yaml`.

## 1. Secure credentials first

Database and Gmail credentials were exposed during setup. Rotate the Neon database password and Gmail App Password before using them in production. Keep the new values in provider environment settings, not in Git or chat. The repository `.gitignore` excludes `.env` files; never force-add them.

## 2. Push the project code

The deployment providers need the current code from GitHub. Review and commit the intended project changes, then push them to the repository. Do not include `.env` files or secrets in the commit.

## 3. Deploy the frontend to Vercel

1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `frontend` and use the Vite defaults: build command `npm run build`, output directory `dist`.
3. Deploy once to obtain the frontend's HTTPS URL. The API will not work until the backend is deployed and `VITE_API_URL` is set.

## 4. Deploy the API to Render

1. In Render, create a Blueprint and select this repository. Render reads `render.yaml`; the service root is `backend`.
2. Set the prompted environment values in Render, never in `render.yaml`:
   - `DATABASE_URL`: the rotated Neon PostgreSQL connection URL.
   - `FRONTEND_URL`: the Vercel HTTPS origin, with no trailing slash.
   - `CORS_ORIGINS`: the Vercel origin, e.g. `https://your-app.vercel.app` (plain URL is accepted; no quotes or brackets needed).
   - `SMTP_USER` and `SMTP_FROM_EMAIL`: the sender account; `SMTP_PASSWORD`: its rotated Gmail App Password.
3. Wait for `/` health check to pass. The API documentation is at `/docs` on the Render service URL.
4. Keep this service to one instance while `ENABLE_EMAIL_WORKER=true`; the worker runs inside the API process and multiple instances could send duplicate emails. The free plan can sleep while idle, so the first request may be slow.

On startup the backend creates missing ORM tables and applies the existing additive column migration. It does not delete employee data in Neon.

## 5. Connect Vercel to Render

1. In Vercel project settings, add `VITE_API_URL` with the Render HTTPS service origin, without a trailing slash (for example `https://your-api.onrender.com`).
2. Redeploy the frontend so the Vite build embeds that API URL.
3. In Render, verify `CORS_ORIGINS` contains the exact production Vercel origin. Multiple origins can be comma-separated; if you use Vercel preview URLs, add those origins too, or test through the production URL.

## 6. Verify production

- Open the frontend and confirm the Employee Directory loads the Neon employees.
- Open the Render `/docs` page and check `GET /api/employees` and `GET /api/tasks`.
- Create one test task assigned to a test employee; use **Send Now** only when you intend to deliver a real email.
- Confirm the task appears in the inventory and Neon after refreshing.

The local `.env` remains separate from provider settings. Do not change the local database URL just to deploy; production uses Render's `DATABASE_URL` environment variable.
