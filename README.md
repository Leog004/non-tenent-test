# Server-Driven UI Demo (React + Express)

This demo shows a **server-driven UI** where the Refund button only appears when the user has the `canRefund` capability.
The server **also enforces** the capability on the refund API, so even crafted requests get denied.

## What’s inside
- `client/` – Neutral React app (Vite) with a tiny schema renderer and generic widgets (ActionBar, DataTable, Form).
- `server/` – Express BFF that issues a cookie with capabilities, returns a UI Manifest, and enforces authorization.

## Prereqs
- Node 18+

## Run it
In one terminal (server):
```bash
cd server
npm install
npm run dev
```

In another terminal (client):
```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Try the capabilities
- Click **"Login: Create only"** → you get `canCreatePayment` only. No Refund button.
- Click **"Login: Create + Refund"** → you get `canCreatePayment, canRefund`. Refund button appears for PAID rows.
- Click **"Logout"** → back to anon, no caps.

## Security
- The client **never ships** tenant-unique components; it only renders generic widgets from a registry.
- The server emits a **manifest** that includes or omits actions based on capabilities.
- The refund API **re-checks** `canRefund`, preventing access even if someone crafts a fetch by hand.

## Notes
- For brevity, the "New Payment" modal is not fully wired; focus is on Refund visibility + server enforcement.
- Vite dev server proxies `/session`, `/ui`, `/api`, `/login`, `/logout` to the Express server.
- In production, serve the built client behind the same origin as the BFF (or set proper CORS).

## Next steps
- Add themes per tenant (`/ui/theme`) and map to CSS variables.
- Add more predicates (e.g., row.status === 'PAID') evaluated server-side in the manifest when needed.
- Persist data in a DB; add proper auth (OIDC) and signed manifests if caching at the edge.
