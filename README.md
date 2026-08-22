# PCC (Patient Coordinator Center)

## Overview
**PCC (Patient Coordinator Center)** is a full‑stack case‑management system for healthcare professionals and medical coordinators. It centralises patient records, admission requests, department‑specific clinic enrollments, research study data, and social‑follow‑up alarms. The stack consists of:
- **Laravel (PHP 8.3)** backend API
- **React (Vite, TypeScript)** frontend UI
- **MySQL 8.0** database
- Deployed on **Windows Server with IIS** (no Docker)

## Prerequisites
- Git (to clone the repository)
- PHP 8.x with required extensions (`pdo_mysql`, `mbstring`, `openssl`, `curl`, `gd`, `fileinfo`, `zip`)
- Composer
- Node.js (LTS) + npm
- IIS with URL Rewrite and Application Request Routing (ARR) modules
- MySQL 8.0 (installed locally or on a separate DB server)
- A modern browser for the UI

## Server Setup
See [`deploy/SERVER_SETUP.md`](deploy/SERVER_SETUP.md) for the complete step-by-step guide.

The quick path for a fresh server:
```powershell
# Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
cd C:\path\to\this\repo\deploy
.\FULL_SETUP.ps1
```

## Manual Local Development

### Backend (Laravel)
```bash
cd Backend-laravel

# Copy and configure env
cp .env.example .env
# Edit .env: set DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD, APP_URL

# Install dependencies
composer install

# Generate app key, run migrations
php artisan key:generate
php artisan migrate
php artisan storage:link

# Start dev server
php artisan serve
# API available at: http://localhost:8000/api
```

### Frontend (React + Vite)
```bash
cd Frontend-react

# Install dependencies
npm install

# Start dev server
npm run dev
# UI available at: http://localhost:5173

# Build for production
npm run build
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
│   README.md                   # This documentation
│   web.config                  # IIS URL rewrite rules
│
├─ Backend-laravel/            # Laravel application
│   ├─ app/                     # Controllers, Models, etc.
│   ├─ database/
│   │   └─ migrations/          # Migration files
│   ├─ routes/api.php           # API routes (apiResource for Cases)
│   └─ .env.example             # Template environment file
│
├─ Frontend-react/              # React + Vite application
│   ├─ vite.config.ts           # Vite build configuration
│   ├─ src/
│   │   ├─ components/PatientForm/PatientForm.tsx   # Main form (contains 20+ fields)
│   │   └─ ... (other components, utils, types)
│   └─ package.json
│
└─ deploy/                     # Deployment scripts and docs
    ├─ FULL_SETUP.ps1           # One-shot automated server setup
    ├─ setup_server.ps1         # Interactive server bootstrap
    ├─ deploy.ps1               # Called on each GitHub push
    ├─ webhook_receiver.ps1     # GitHub webhook listener service
    ├─ install_service.ps1      # Installs webhook as Windows Service
    └─ SERVER_SETUP.md          # Full deployment guide
```

## Backend Details
- **PHP extensions** required: `pdo_mysql`, `gd`, `intl`, `mbstring`, `openssl`, `curl`, `fileinfo`, `zip`
- **API**: `Route::apiResource('case', CasesController::class);` provides standard CRUD endpoints (`GET /api/case`, `POST /api/case`, etc.)
- **Model** `CASES` includes social notes, alarm data, `programs`, `research`, etc. with proper `$fillable` and `$casts`
- **Controller** validation accepts all form fields (nullable strings/booleans)

## Frontend Details
- **vite.config.ts** configures the Vite build for production output
- The form (`PatientForm.tsx`) uses a dynamic `localPatient.programs` object
- All backend fields have matching form inputs (social notes, alarm date/priority, department‑clinic enrollment, research JSON data)

## Auto-Deploy (CI/CD)
Every push to `main` on GitHub automatically:
1. Triggers the webhook receiver (Windows Service on port 9000)
2. Runs `git pull origin main`
3. Runs `composer install --no-dev --optimize-autoloader`
4. Runs Laravel artisan commands (`migrate`, `config:cache`, etc.)
5. Runs `npm install && npm run build`
6. Recycles the IIS Application Pool

See [`deploy/SERVER_SETUP.md`](deploy/SERVER_SETUP.md) for setup instructions.

## Testing & Linting
- **Backend**: `cd Backend-laravel && php artisan test`
- **Frontend**: `cd Frontend-react && npm run lint`

## Further Development
- Add Swagger/OpenAPI docs for the Laravel API.
- Implement authentication (Laravel Sanctum) and protect the API.
- Extend the frontend with role‑based access controls.
- Write end‑to‑end tests using Cypress or Playwright.

---
Feel free to open issues or submit pull requests. Enjoy building with **PCC (Patient Coordinator Center)**!
