# Uff-Da Eats Command Center

A local-first, installable food-truck operations PWA. The app intentionally remains a static application: no server, framework build chain, or external database is required for single-device operation.

## Primary workflow

1. Configure every ingredient and packaging input in **Cost Library** with purchase quantity, unit, price, and effective date.
2. Open **Daily Profit** after service.
3. Enter gross sales, sales tax, discounts/refunds, labor, processing fees, direct costs, overhead, and exact measured usage.
4. Review the live operating-profit calculation.
5. Save the service day. The report stores immutable cost snapshots, so later price changes cannot alter historical profitability.

## Financial correctness

- Currency inputs are converted to integer cents.
- Ingredient usage uses rational decimal/unit arithmetic in `core.js` rather than floating-point currency math.
- Sales tax collected is excluded from net operating revenue.
- Food, packaging, labor, processing, direct expenses, and allocated overhead are separated.
- Ingredient price changes are effective-dated.
- Finalized daily reports retain the purchase-cost basis used when saved.
- Waste and complimentary/staff usage are separated from sold usage but remain part of total consumed cost.

A result is only as exact as the measurements and source costs entered. The application avoids claiming precision beyond the provided data.

## App areas

- Dashboard
- Daily Profit
- Cost Library
- Reports
- Sales
- Events & Catering
- CRM
- Inventory
- Menu Costing
- Purchases
- Labor
- Expenses
- Vendors
- Settings / backup / restore

## Run locally

From the repository root:

```bash
cd command-center
python3 -m http.server 5174
```

Open `http://localhost:5174`.

## Tests

From the repository root:

```bash
node --test command-center/tests/finance.test.mjs
```

The finance tests cover deterministic currency rounding, weight conversion, incompatible-unit rejection, tax exclusion, and complete daily-profit composition.

## Persistence and backup

Production records are stored in browser `localStorage` under schema v3 and synchronized between open tabs with `BroadcastChannel`. Use **Backup** regularly to export a complete JSON copy. Restore is available in Settings.

This storage model is deliberately appropriate for a single-owner/single-device workflow. A server database and authentication should only be introduced when multi-user or cross-device requirements become real; adding them earlier would increase operational complexity without improving the core calculation workflow.

## Structure

```text
command-center/
  index.html
  styles.css
  app.js            # UI, state, CRUD and workflows
  core.js           # deterministic finance/unit engine
  service-worker.js
  manifest.webmanifest
  tests/
    finance.test.mjs
  README.md
```

## Design system

The UI uses a restrained neutral system with a dark command rail, white operational surfaces, compact typography, responsive table/list layouts, strong financial hierarchy, subtle hover/reveal motion, visible keyboard focus states, sticky profit summaries, and `prefers-reduced-motion` support. No external fonts or UI libraries are required, preserving offline operation and fast startup.
