# RNB Collections Admin Panel

Admin dashboard for RNB Collections. Separate from the customer Next.js storefront.

## Stack

- React + Vite + TypeScript
- React Router
- Lucide React
- Recharts

## Setup

```bash
cd /home/usman/Blockmob/rnb/admin
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

`.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Do **not** put Cloudinary secrets in the admin `.env`.

## Backend

Start the API first:

```bash
cd /home/usman/Blockmob/rnb/backend
npm run seed:admin
npm run dev
```

Login uses the seeded admin from backend `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Notes

- Data comes from MongoDB via the Express API (`rnb_collections`)
- Customer frontend at `rnb-collections` must not be modified from this project
- Zivora is a separate project/database and must not be touched
