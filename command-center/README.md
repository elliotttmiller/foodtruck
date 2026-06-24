# Food Truck Command Center

Standalone PWA command center for managing a food truck business outside of the public website architecture.

This tool is intentionally isolated from the existing customer-facing website. It lives inside `/command-center/` and can be opened locally through a static web server or deployed later as its own static app.

## How to Run Locally

Do not open `index.html` directly by double-clicking it. Because this is a PWA with a service worker, it should be served through a local web server.

### Option 1: Run with Python

From the root of the repo:

```bash
cd command-center
python3 -m http.server 5174
```

Then open this address in your browser:

```txt
http://localhost:5174
```

### Option 2: Run with Node / npx

From the root of the repo:

```bash
npx serve command-center
```

Then open the local address shown in the terminal. It will usually look similar to:

```txt
http://localhost:3000
```

### Option 3: Use VS Code Live Server

1. Open the repo in VS Code.
2. Install the Live Server extension if it is not already installed.
3. Right-click `command-center/index.html`.
4. Select **Open with Live Server**.

## What You Should See

When the app opens, you should see the **Food Truck Command Center** dashboard with a left-side navigation menu.

Main sections include:

- Dashboard
- Sales Tracker
- CRM
- Events & Catering
- Inventory
- Menu Costing
- Purchases
- Vendors
- Labor
- Expenses
- Reports
- QuickBooks export preparation
- Settings

## Current MVP Scope

The first implementation includes:

- Dashboard with owner-friendly KPIs
- Sales tracker
- CRM for customers, catering leads, and event contacts
- Events and catering pipeline
- Inventory with reorder alerts
- Menu costing and margin watch
- Purchases log
- Vendor manager
- Labor tracker
- Expense tracker
- Reports and CSV exports
- QuickBooks-ready export center
- JSON backup/restore
- Offline-capable PWA shell
- Install prompt support where supported by the browser

## Storage Model

The current MVP stores records in the browser using `localStorage`.

That means records are saved to the browser/device you are using. This is suitable for early business modeling, daily workflow testing, and single-device use. It is not a final multi-user database.

Before using this as a team-wide production system, migrate the data layer to a backend such as Supabase, Firebase, SQLite/Postgres, or another secure persistence layer.

## Backup and Restore

Inside the app, use:

- **Backup Data** to download a JSON backup of all local records.
- **Restore Backup** in Settings to reload a saved JSON backup.
- CSV export buttons to export individual sections for accounting, reporting, or spreadsheet review.

## QuickBooks Boundary

The browser PWA does not directly connect to QuickBooks Online because Intuit OAuth credentials and refresh tokens must not be stored in public frontend code.

The app is structured to prepare QuickBooks-ready data through clean CSV exports and status fields. A full integration should be added later through a backend connector that handles:

- Intuit OAuth 2.0 authorization
- Realm/company ID handling
- Secure token storage
- Refresh-token rotation
- Sales, expense, vendor, and customer mapping
- Sync logs and retry handling
- Manual review before records are pushed to QuickBooks

## File Structure

```txt
command-center/
  index.html
  styles.css
  app.js
  manifest.webmanifest
  service-worker.js
  README.md
```

## Future Build Phases

1. Replace localStorage with a real database.
2. Add user authentication and staff roles.
3. Add receipt/photo upload support.
4. Add true QuickBooks backend sync.
5. Add POS import from Square/Toast/Clover exports.
6. Add mobile-first daily prep checklist.
7. Add inventory depletion based on menu-item sales and recipes.
