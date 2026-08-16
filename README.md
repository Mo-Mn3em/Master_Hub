# PCC (Patient Coordinator Center)

## Overview
**PCC (Patient Coordinator Center)** is a full‑stack case‑management system for healthcare professionals and medical coordinators. It centralises patient records, admission requests, department‑specific clinic enrollments, research study data, and social‑follow‑up alarms. The stack consists of:
- **Laravel (PHP 8.3)** backend API
- **React (Vite, TypeScript)** frontend UI
- **MySQL 8.0** database with **phpMyAdmin** for inspection
- A **single Docker Compose** setup that brings up all components with a single command.

## Prerequisites
- Docker Desktop (or Docker Engine) installed & running
- Git (to clone the repository)
- Optional: a modern browser for the UI and phpMyAdmin

## Docker Setup
The repository ships a `docker-compose.yml` that defines four services:
1. **db** – MySQL 8.0 (host port `3307`)
2. **phpmyadmin** – GUI for the database (host port `8080`)
3. **backend** – Laravel API (host port `8000`)
4. **frontend** – React + Vite dev server (host port `5173`)

### First‑time setup (new machine)
```bash
# Clone the repo
git clone https://github.com/Mo-Mn3em/Master_Hub.git
cd Master_Hub

# Build and start everything
docker compose up --build
```
What this does:
- Pulls the official MySQL, phpMyAdmin, PHP and Node images
- Installs Composer dependencies (PHP) and npm packages (Node) inside the containers
- Runs `php artisan migrate --force` automatically to create the `cases` table with all new columns
- Starts the Vite dev server with hot‑reload (`http://localhost:5173`)

### Subsequent runs
```bash
# Start already‑built containers
docker compose up
```
To stop the stack:
```bash
docker compose down
```
To completely wipe the persisted MySQL data (start fresh):
```bash
docker compose down -v
```
To run a migration manually (e.g., after editing a migration file):
```bash
docker exec master_hub_backend php artisan migrate
```

## Recent Features & Enhancements

### 🎨 1. Dynamic Case Card Colors & Multi-Alarm Visualization
- **Clean White Surface Design**: Replaced heavy yellow card fills with clean white surfaces (`#ffffff`) and soft 4px top accent indicator lines.
- **Dynamic Multi-Alarm Gradients**: Cards with multiple active alarms across different priority levels (`Red`, `Yellow`, `Blue`) automatically convert their top accent bar into a multi-color linear gradient (`linear-gradient(90deg, #ef4444, #f59e0b, #3b82f6)`).
- **Individual Alarm Badges**: Active alarms inside patient cards render distinct priority pills (`RED`, `YELLOW`, `BLUE`) and color status dots for at-a-glance clinical review.

### 🧭 2. Unified Header & Sidebar UI
- **Equalized Top Bar Heights**: Aligned the sidebar brand header and main content header heights to create a continuous top horizontal line across the application.
- **Sidebar & Header Cleanup**: Removed unnecessary close buttons and updated header font weights to normal non-bold (`500`).
- **Dedicated Clinical Icons**: Added colored Lucide icons for all 18+ specialty programs in the sidebar and top navigation headers using official department brand colors.

### 🔍 3. Filter Bar & Date Range Improvements
- **"Apply Filter & Sort" Button**: Added a primary clinical teal action button next to **"Reset Filters"**.
- **Date Range Query Fix**: Updated **REGISTERED FROM** and **REGISTERED TO** filtering across both backend Laravel Eloquent queries and frontend state parsing to check both `created_at` timestamps and `date_of_joining_request`.
- **Streamlined Filters**: Cleaned up the filter bar layout by removing redundant dropdown options.

### 🖼️ 4. Custom Hospital Favicon
- Configured custom hospital logo favicons (`/logo.png?v=2`, `/favicon.ico?v=2`) in HTML `<head>` with cache-busting parameters across modern web browsers and mobile devices.

### 🗄️ 5. Dedicated Department Database Tables
- Architected 20 dedicated department tables (`dept_spinal_surgery`, `dept_cardiac`, `dept_anesthesia`, etc.) and a pure pivot table (`case_department`) with automated Laravel seeders (`TenCasesSeeder.php`).

## Project Structure
```
Master_Hub/
│   docker-compose.yml          # Orchestrates db, phpmyadmin, backend, frontend
│   README.md                   # This documentation
│
├─ Backend-laravel/            # Laravel application
│   ├─ Dockerfile               # PHP 8.3 image, Composer install, entrypoint
│   ├─ docker-entrypoint.sh     # Waits for MySQL, runs migrations, starts artisan serve
│   ├─ app/                     # Controllers, Models, etc.
│   ├─ database/
│   │   └─ migrations/          # Migration that creates/updates the `cases` table
│   ├─ routes/api.php           # API routes (apiResource for Cases)
│   └─ .env.example             # Template environment file
│
└─ Frontend-react/              # React + Vite application
    ├─ Dockerfile               # Node 20 image, npm install, Vite dev server
    ├─ vite.config.ts           # Sets `server.host` to `0.0.0.0` for Docker exposure
    ├─ src/
    │   ├─ components/PatientForm/PatientForm.tsx   # Main form (contains 20+ fields)
    │   └─ ... (other components, utils, types)
    └─ package.json
```

## Backend Details
- **Dockerfile** installs required system libs (`libicu-dev`, `libgd`, etc.) and PHP extensions (`pdo_mysql`, `gd`, `intl`, `mbstring`).
- **docker-entrypoint.sh** performs the following steps:
  1. Ensures `.env` exists (copies from `.env.example` if missing).
  2. Overwrites DB connection variables to point to the Docker MySQL service.
  3. Generates an `APP_KEY` if not set.
  4. Waits for MySQL to become ready.
  5. Runs `php artisan migrate --force` (idempotent, only applies new migrations).
  6. Clears cached config/route/cache.
  7. Starts the Laravel development server on `0.0.0.0:8000`.
- **API**: `Route::apiResource('case', CasesController::class);` provides standard CRUD endpoints (`GET /api/case`, `POST /api/case`, etc.).
- **Model** `CASES` now includes the newly added fields (social notes, alarm data, `programs`, `research`, etc.) and proper `$fillable` and `$casts`.
- **Controller** validation has been expanded to accept all form fields (previous rigid enums replaced with nullable strings/booleans).

## Frontend Details
- **Dockerfile** uses `node:20-alpine`, installs dependencies, and runs `npm run dev -- --host 0.0.0.0`.
- **vite.config.ts** now contains:
```ts
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 }
})
```
- The form (`PatientForm.tsx`) uses a dynamic `localPatient.programs` object; TypeScript errors were fixed by asserting `Record<string, any>` for fallback objects.
- All new backend fields have matching form inputs (e.g., social notes, alarm date/priority, department‑clinic enrollment fields, research JSON data).

## Running the Application
1. `docker compose up --build` – builds images and starts containers.
2. Open a browser:
   - Frontend UI: <http://localhost:5173>
   - Backend API root (JSON): <http://localhost:8000/api>
   - phpMyAdmin: <http://localhost:8080> (login with `root` / `root`)
3. Use the UI to create/edit patient cases; data is persisted in the MySQL volume `db_data`.

## Testing & Linting
- **Backend**: `docker exec master_hub_backend php artisan test`
- **Frontend**: Inside the frontend container you can run `npm run lint` or `npm run test` (if a test suite is added).

## Further Development
- Add Swagger/OpenAPI docs for the Laravel API.
- Implement authentication (Laravel Sanctum) and protect the API.
- Extend the frontend with role‑based access controls.
- Write end‑to‑end tests using Cypress or Playwright against the Docker services.

---
Feel free to open issues or submit pull requests. Enjoy building with **PCC (Patient Coordinator Center)**!
