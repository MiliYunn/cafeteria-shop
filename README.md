# APCafeteria Shop Portal

POS-style Angular shop workspace served at `http://127.0.0.1:5174`.

Run `npm install`, then `npm start`. Open the generated `login_url` from the admin shop record. The page sends its encrypted `ce` and `cp` values to Flask; credentials and the encryption key are never stored in the Angular bundle.

Existing shops created before migration 033 receive an empty login URL. Save a new password for those shops in the admin portal to generate their secure URL.

## Management pages

- `/pos/menus` — paginated menu CRUD with multiple genres, search, genre, and availability filters
- `/pos/staff` — paginated staff CRUD with search and active-status filters
- `/pos/payment-accounts` — paginated payment-account CRUD with method selection
- `/pos/settings` — edit the authenticated shop's opening and closing times

All data is scoped to the authenticated shop by the backend.
