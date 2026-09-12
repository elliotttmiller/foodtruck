# Archived UFF-DA marketing website

This directory preserves the previous Next.js website as a self-contained project. It is not used by the active GitHub Pages deployment. The live application is the sibling `command-center/` dashboard.

To develop this site separately, run `npm ci`, then `npm run dev` here. `npm run build` generates a static export in this directory's ignored `out/` folder. It does not overwrite the repository's `docs/` deployment bundle.

`src/`, `public/`, `scripts/`, and the Next.js configuration all belong to this directory. `.env.production` contains only public website settings and remains available for a future independent website deployment.
