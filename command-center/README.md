# Uff-Da Eats Command Center

Production React/Vite operations application for Uff-Da Eats. The app is intentionally local-first and focused: job inventory reconciliation, exact service profitability, effective-dated food/packaging costs, sales, events, CRM, inventory, menu costing, purchases, labor, expenses, vendors, reporting, backup/restore, and offline operation.

## Primary job workflow

1. Open **Job Counts** before service.
2. Enter the event/location and opening inventory for every active cost item.
3. Start the job. Opening counts and their cost basis are locked into the job session.
4. After service, enter any mid-job additions/restocks, ending counts, waste, and comp/staff usage.
5. The app reconciles each item using `opening + additions - ending = depletion`.
6. Depletion is separated into sold/service usage, waste, and comps.
7. Enter gross receipts, tax, labor, processing fees, direct expenses, and overhead.
8. Close the job to create an immutable item-by-item profitability ledger.

Items can be marked as **Direct sale item** when one counted unit equals one customer sale (for example, canned drinks). Raw ingredients remain **Ingredient / input** and are reported as service usage rather than falsely labeled as menu-item sales.

## Architecture

- React 18 + Vite
- Lightweight hash routing for static hosting; no router dependency
- Central React store with versioned `localStorage` persistence and `BroadcastChannel` cross-tab sync
- `ftcc.live.v3` storage key retained; schema version is migrated in place
- Deterministic integer-cent/rational finance engine in `src/lib/finance.js`
- Exact decimal inventory reconciliation without floating-point quantity math
- Effective-dated ingredient cost histories and immutable job cost snapshots
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
  job-reconciliation.css
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
    DashboardPage.jsx
    GenericModulePage.jsx
    JobReconciliationPage.jsx
    ReportsPage.jsx
    SettingsPage.jsx
```

## Data integrity

Money is not calculated with floating-point dollars. Currency inputs are converted to integer cents, measured-unit conversions and count reconciliation use rational/integer arithmetic, and finalized job reports retain both opening/ending inventory and supplier-cost snapshots so later price changes cannot rewrite historical profit.

Start/end inventory can prove exact depletion. It proves exact customer units sold only for items explicitly configured as direct-sale units. For raw ingredients, the app truthfully reports consumed/service quantity unless a separate recipe/yield model is introduced.

A result is only as exact as the physical counts, source costs, revenue, waste, comp, restock, and expense data entered.

## Storage and backups

Records are persisted under `ftcc.live.v3` in the browser. JSON backup/restore is built into Settings and the global Backup action. The architecture is appropriate for the current single-owner local workflow; database/auth infrastructure should be added only if real multi-device or multi-user synchronization becomes necessary.
