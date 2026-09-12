# UFF-DA Eats Command Center

The active application is the Vite operations dashboard in [`command-center/`](command-center/). Its Live Orders screen receives Square sales through Supabase Edge Functions; Square credentials remain server-side.

## Working directories

| Directory | Purpose |
| --- | --- |
| `command-center/` | Active dashboard source, tests, public assets, local Vite configuration |
| `supabase/` | Live Orders database migrations and Square Edge Functions |
| `docs/` | Committed GitHub Pages output: Command Center plus a root redirect |
| `website/` | Archived independent Next.js website source and assets |

Run the active app locally:

```bash
cd command-center
npm ci
npm run dev
```

Test and build the Pages bundle:

```bash
cd command-center
npm run check
```

The build writes to `docs/command-center/`. GitHub Pages publishes `main:/docs` at [Live Orders](https://elliotttmiller.github.io/foodtruck/command-center/#/live-orders). The project root redirects there. `.github/workflows/build-command-center.yml` validates Command Center changes and commits updated static output on pushes to `main`.

To preview the actual ticket layout without credentials or a real sale, open [Live Orders preview](https://elliotttmiller.github.io/foodtruck/command-center/#/live-orders-demo). Sample tickets are browser-only: use **Add test order**, **Ready**, and **Complete** to rehearse the workflow. Exit preview to return to authenticated live orders. This does not verify the Square integration.

Set Square production tokens and webhook keys in **Supabase Edge Function Secrets**. See [the Live Orders runbook](command-center/LIVE_ORDERS_TRIAL.md) and [the environment setup reference](.env.example). `command-center/.env.example` is solely for public local Vite values. Do not put secrets in the repository.

The original marketing site remains available as source in [`website/`](website/). Run `npm ci` and `npm run dev` inside `website/` to work on it independently. Its `npm run build` writes to `website/out/` and never touches the Command Center deployment.
