# UFF-DA Food Truck

Production repository for the UFF-DA Minnesota food-truck brand and marketing website.

## Repository architecture

### `src/` — production website frontend
The active public-facing website is a focused Next.js marketing site. Legacy restaurant-template routes, ordering UI, tracking UI, reusable template components, and obsolete frontend integrations have been removed.

Primary frontend files:
- `src/app/(main)/page.tsx` — UFF-DA landing page
- `src/app/(main)/uffda.module.css` — UFF-DA page design system
- `src/app/layout.tsx` — root document and metadata
- `src/app/globals.css` — global styles
- `src/config/site.ts` — public brand/site configuration

### `public/` — production web assets
Contains brand assets and photography currently used by the UFF-DA landing experience. Generated build output is not source-controlled.

### `command-center/` — internal operations
The command center is intentionally isolated from the production Next.js frontend. It contains the existing standalone internal business/operations interface and its supporting files. Changes to the command center should not introduce dependencies into `src/` unless deliberately promoted into the public website.

## Development

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run lint
npm run build
npm start
```

## Deployment

The public site is designed to deploy from the repository source using the Next.js build pipeline. Do not commit generated `.next/` or `out/` directories.

## Architecture rules

1. `src/` is reserved for the active UFF-DA public frontend.
2. Internal operational tooling belongs under `command-center/`.
3. Do not reintroduce the former restaurant template, ordering flows, authentication, payment integrations, or tracking application into the marketing frontend unless the product scope explicitly changes.
4. Keep production assets in `public/` limited to assets actually used by the current site or intentionally retained for near-term UFF-DA content work.
5. Generated build artifacts are never source files.
