# Uff-Da Eats Command Center

Production React/Vite operations application for Uff-Da Eats. The app is intentionally local-first and focused: daily profitability, effective-dated food/packaging costs, sales, events, CRM, inventory, menu costing, purchases, labor, expenses, vendors, reporting, backup/restore, and offline operation.

## Architecture

- React 18 + Vite
- Lightweight hash routing for static hosting; no router dependency
- Central React store with versioned `localStorage` persistence and `BroadcastChannel` cross-tab sync
- Existing `ftcc.live.v3` data schema preserved
- Deterministic integer-cent/rational finance engine in `src/lib/finance.js`
- Effective-dated ingredient cost histories and immutable saved daily cost snapshots
- Static PWA service worker with deterministic Vite asset names
- Lucide icons only; no heavyweight component framework

## Development

```bash
cd command-center
npm install
npm run dev
```

## Verification and production build

```bash
npm run check
npm run build
```

The production bundle is emitted to `command-center/dist/` and can be hosted from any static origin.

## Source structure

```text
src/
  App.jsx
  main.jsx
  styles.css
  components/
    Modal.jsx
    Shell.jsx
  config/
    modules.js
  lib/
    finance.js
    format.js
    store.jsx
  pages/
    CostLibraryPage.jsx
    DailyProfitPage.jsx
    DashboardPage.jsx
    GenericModulePage.jsx
    ReportsPage.jsx
    SettingsPage.jsx
```

## Data integrity

Money is not calculated with floating-point dollars. Currency inputs are converted to integer cents, measured-unit conversions use rational arithmetic, and saved service-day reports retain cost snapshots so later supplier price changes cannot rewrite historical profit.

A result is only as exact as the measurements and source costs entered.

## Storage and backups

Records are persisted under `ftcc.live.v3` in the browser. JSON backup/restore is built into Settings and the global Backup action. The architecture is appropriate for the current single-owner local workflow; database/auth infrastructure should be added only if real multi-device or multi-user synchronization becomes necessary.
