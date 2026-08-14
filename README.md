# UFF-DA Food Truck

Production repository for the UFF-DA Minnesota food-truck brand and marketing website.

## Repository architecture

### `src/` — production website frontend
The active public-facing website is a focused Next.js marketing site.

Primary frontend files:
- `src/app/(main)/page.tsx` — UFF-DA landing page
- `src/app/(main)/uffda.module.css` — UFF-DA page design system
- `src/app/layout.tsx` — root document and metadata
- `src/app/globals.css` — global styles
- `src/config/site.ts` — public brand/site configuration

### `public/` — production web assets
Contains UFF-DA brand assets used by the production frontend. The canonical website logo is `public/brand/uff-da-logo.png`.

### `command-center/` — internal operations
The command center is intentionally isolated from the production Next.js frontend.

### `docs/` — GitHub Pages deployment bundle
`docs/` contains the generated static website that GitHub Pages publishes. Do not hand-edit this directory. Running `npm run build` replaces it from the fresh Next.js static export.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The build performs two stages:

1. `next build` creates a static export in the ignored `out/` working directory.
2. `scripts/prepare-github-pages.mjs` replaces `docs/` with that export and creates `docs/.nojekyll` so GitHub serves the `_next` assets correctly.

`.next/` and `out/` are intentionally ignored. `docs/` is intentionally tracked because it is the GitHub Pages publishing source.

## GitHub Pages

This repository is configured as a GitHub **project Pages** site at:

`https://elliotttmiller.github.io/foodtruck/`

In GitHub, configure:

**Settings → Pages → Build and deployment → Deploy from a branch**

- Branch: `main`
- Folder: `/docs`

Then the normal release flow is:

```bash
git pull origin main
npm install
npm run build
git add docs
git commit -m "Build GitHub Pages site"
git push origin main
```

A push containing changed files under `docs/` triggers GitHub Pages publication from `main:/docs`.

## GitHub Pages path configuration

`.env.production` currently defines:

```env
NEXT_PUBLIC_BASE_PATH=/foodtruck
NEXT_PUBLIC_SITE_URL=https://elliotttmiller.github.io/foodtruck
```

This ensures Next.js application assets and UFF-DA brand assets resolve correctly under the repository subpath. If the site later moves to a custom root domain, set `NEXT_PUBLIC_BASE_PATH` to an empty value and update `NEXT_PUBLIC_SITE_URL`, then rebuild.

## Architecture rules

1. `src/` is reserved for the active UFF-DA public frontend.
2. Internal operational tooling belongs under `command-center/`.
3. Do not reintroduce the former restaurant template, ordering flows, authentication, payment integrations, or tracking application unless product scope explicitly changes.
4. Keep `public/` limited to active UFF-DA assets.
5. Never commit `.next/` or `out/`.
6. Never hand-edit generated files in `docs/`; regenerate them with `npm run build`.
