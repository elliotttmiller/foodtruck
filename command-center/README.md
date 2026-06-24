# Food Truck Command Center

Standalone PWA command center for managing a food truck business outside of the public website architecture.

This tool is intentionally isolated from the existing customer-facing website. It can be hosted from `/command-center/`, opened locally through a static web server, or deployed as a separate static app.

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

This is suitable for early business modeling, daily workflow testing, and single-device use. It is not a final multi-user database. Before using this as a team-wide production system, migrate the data layer to a backend such as Supabase, Firebase, SQLite/Postgres, or another secure persistence layer.

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

## Running Locally

Because this is a static PWA, serve the folder from a local web server rather than opening files directly.

Example:

```bash
cd command-center
python3 -m http.server 5174
```

Then open:

```txt
http://localhost:5174
```

## File Structure

```txt
command-center/
  index.html
  styles.css
  app.js
  manifest.webmanifest
  service-worker.js
```

## Future Build Phases

1. Replace localStorage with a real database.
2. Add user authentication and staff roles.
3. Add receipt/photo upload support.
4. Add true QuickBooks backend sync.
5. Add POS import from Square/Toast/Clover exports.
6. Add mobile-first daily prep checklist.
7. Add inventory depletion based on menu-item sales and recipes.
