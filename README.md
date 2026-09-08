# Marketday

Marketday is a responsive wet-market storefront built with Next.js and React.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Production verification:

```bash
npm run lint
npm run build
npm start
```

## Deployment

Deploy the project to Vercel or any Node.js host using Node 20+. Set
`NEXT_PUBLIC_SITE_URL` to the deployed origin. The app uses remote Unsplash
images, so the production host must allow outbound HTTPS image requests.

The current UI includes demo catalog, cart, order tracking, account, and admin
surfaces. Connect a database, authentication provider, payment processor, and
delivery service before accepting real orders. Keep all secret credentials
server-side and add them to the deployment provider’s environment settings.

## Admin access

Create the staff user in Supabase Authentication → Users, then either set the
user email in Vercel as `NEXT_PUBLIC_ADMIN_EMAIL` (or the comma-separated
`NEXT_PUBLIC_ADMIN_EMAILS`) or assign `role: "admin"` in the user metadata.
Redeploy after changing Vercel environment variables because public variables
are embedded during the build.

## Supabase database setup

Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor
before using profiles, products, addresses, orders, or admin catalog controls.
The migration enables row-level security and only permits admin product/order
operations when the authenticated user has `app_metadata.role = "admin"`.
