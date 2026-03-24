# anupro.me Landing + Admin

Production-ready personal domain hub with:
- Premium landing page for projects
- Protected admin dashboard (projects, settings, analytics)
- Help Center with FAQs, safety/rules, dispute process
- Contact form + admin messages inbox

## Tech Stack
- Node.js
- Express
- express-session
- bcryptjs
- Vanilla HTML/CSS/JS

## Project Structure
- `server.js` - app server and APIs
- `public/` - landing, admin, help center UI
- `data/` - JSON persistence files
- `.env.example` - deployment environment template

## Quick Start
1. Install dependencies:
   - Windows PowerShell: `npm.cmd install`
2. Create environment file:
   - Copy `.env.example` to `.env`
3. Fill required environment variables in `.env`.
4. Start app:
   - `npm.cmd start`
5. Open:
   - Home: `http://localhost:3001`
   - Admin: `http://localhost:3001/admin`
   - Help Center: `http://localhost:3001/help`

## Required Environment Variables
From `.env.example`:
- `NODE_ENV=production`
- `PORT=3001` (or provider assigned port)
- `APP_DOMAIN=anupro.me`
- `TRUST_PROXY=true` (recommended behind reverse proxy / load balancer)
- `ADMIN_USER=admin`
- `ADMIN_PASSWORD_HASH=<bcrypt hash starting with $2...>`
- `SESSION_SECRET=<strong random secret>`

### Generate Admin Password Hash
Run from project root:
```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_STRONG_PASSWORD', 10));"
```

## Security Notes
- The app refuses to start in production if:
  - `SESSION_SECRET` is left at default
  - `ADMIN_PASSWORD_HASH` is left at default
- Do not commit `.env`.
- Use HTTPS in production.

## Deployment Checklist
1. Set all required environment variables.
2. Point both `anupro.me` and `www.anupro.me` to your app host.
3. Keep HTTPS enabled at the edge/proxy.
4. Ensure persistent storage for `data/` if you need contact messages and analytics retained across restarts.
5. Start command:
   - `npm start`

## Domain Behavior
- Requests to `www.anupro.me` are redirected to `anupro.me`.

## Core Routes
- Public:
  - `/`
  - `/help`
  - `/api/projects`
  - `/api/settings`
  - `/api/contact`
- Auth/Admin:
  - `/admin`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/me`
  - `/api/admin/projects`
  - `/api/admin/projects/import`
  - `/api/admin/projects/reorder`
  - `/api/admin/settings`
  - `/api/admin/analytics`
  - `/api/admin/messages`

## Data Persistence
JSON files are used for lightweight persistence:
- `data/projects.json`
- `data/settings.json`
- `data/analytics.json`
- `data/messages.json`

For real production scale, move these to a database.
