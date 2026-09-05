# APCafeteria Shop Portal

## Tech stack

- Angular 21
- TypeScript 5.9
- Tailwind CSS 4
- Angular Forms
- RxJS
- Lucide Angular icons
- ngx-toastr notifications
- Client-side rendering (CSR)

## Installation

Install Node.js 22.12 or newer, then open PowerShell and run:

```powershell
cd "C:\Parallel Universe\AP Caferteria\Repositories\apcafeteria-shop"
npm ci
```

The Flask backend must also be installed, configured, and migrated before using the portal.

## Running

Start the backend in one PowerShell window:

```powershell
cd "C:\Parallel Universe\AP Caferteria\Repositories\apcafeteria-backend"
.\.venv\Scripts\python.exe manage.py run
```

Start the shop portal in another PowerShell window:

```powershell
cd "C:\Parallel Universe\AP Caferteria\Repositories\apcafeteria-shop"
npm start
```

Open `http://127.0.0.1:5174` in your browser. Press `Ctrl+C` in each PowerShell window to stop the servers.
