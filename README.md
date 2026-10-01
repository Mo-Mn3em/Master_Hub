# Master Hub (Patient Coordinator Center - PCC)

![Master Hub Banner](logo.jpg)

## 🏥 Overview
**Master Hub (Patient Coordinator Center - PCC)** is an enterprise healthcare case-management and clinical coordination platform designed for multi-disciplinary hospital workflows. It centralizes patient records, admission requests, multi-department clinical program enrollments, surgical & anesthesia tracking, research study data, and social follow-up priority alarms.

The solution is built with a modern, high-performance architecture:
- **Backend**: Laravel (PHP 8.3) RESTful API with Eloquent ORM & Sanctum Token Authentication
- **Frontend**: React 18 with TypeScript, Vite, Vanilla CSS design system, Lucide Icons
- **Database**: MySQL 8.0 with dedicated departmental schema tables and pivot relationships
- **Hospital HIS Integration**: Direct bi-directional integration with Nile Alamal Hospital Information System (HIS) for real-time demographics auto-fill and patient visit timeline history
- **Web Server**: Windows Server with IIS (URL Rewrite & ARR modules)

---

## ✨ Key Features & Enhancements

### 👥 1. User Management & Multi-Department Access
- **Multi-Department Staff Assignment**: System administrators can assign users to multiple clinical departments simultaneously via interactive badge selectors.
- **Cross-Department Collaboration**: Department specialists can view cases system-wide and quickly enroll existing cases into their assigned clinics while preserving all other departmental enrollments.
- **Audit Logging & Case Tracking**: Automatic tracking and visual display of `created_by` and `updated_by` attributes on every case card and detail record.

### 🎨 2. Dynamic Case Card Visualization & Multi-Alarm System
- **Clean Clinical White Surfaces**: High-readability card layouts with top indicator accent bars.
- **Dynamic Multi-Alarm Gradients**: Cases with multiple active alarms (`Red`, `Yellow`, `Blue`) dynamically render unified gradient accents (`linear-gradient(90deg, #ef4444, #f59e0b, #3b82f6)`).
- **Alarm Badges & Status Indicators**: Visual badges and countdown/status indicators for immediate clinical triage and social follow-up.

### 🔍 3. Advanced Directory, Filters & Sorting
- **Smart Case Sorting**: Default sorting by *Latest Cases (Newest First)*, *Oldest Cases*, *Surgery Date*, and *Patient Age*.
- **Top Pagination Bar**: Compact page indicators ("Showing X–Y of Z Cases") with responsive navigation controls.
- **Unified Global Filters**: Multi-faceted filtering by Department, Urgency Status, Purpose, and Date Ranges (checking both registration timestamps and join request dates).

### 🩺 4. Dedicated Departmental Forms & Database Tables
Architected with dedicated department tables and seamless pivot mappings:
- **Spinal Surgery (`dept_spinal_surgery`)**
- **Cardiac Surgery (`dept_cardiac`)**
- **Anesthesia & Pre-op Assessment (`dept_anesthesia`)**
- **Surgical List & Operating Room Tracking (`dept_surgery`)**
- **Urology Surgery (`dept_urology`)**
- **ENT & Airway (`dept_ent`)**
- **General Pediatric Surgery (`dept_general_pediatric`)**
- **Maxillofacial Congenital Surgeries (`dept_maxillofacial`)**
- **Reconstructive Surgery (`dept_reconstructive`)**
- **ABCI - Cochlear Implant (`dept_cochlear`)**
- **Hope Start / Prenatal (`dept_hope_start`)**
- **Hypospadias Clinic (`dept_hypospadias`)**
- **Spina Bifida Clinic (`dept_spina_bifida`)**
- **Neurodevelopmental (`dept_neurodevelopmental`)**
- **Liver Transplant (`dept_liver_transplant`)** *(includes donor tracking)*
- **Dental Surgery (`dept_dental`)** *(expanded diagnosis & condition fields)*
- **Microtia Reconstruction (`dept_microtia`)**
- **Orthopedic Surgery (`dept_orthopedic`)**
- **Ophthalmology Clinic (`dept_ophthalmology`)**
- **Plastic & Craniofacial (`dept_plastic`)**

### 🏥 5. Nile Hospital Information System (HIS) Integration
- **Personal Summary Auto-Fill (`/api/nile/personal-summary`)**: Instant demographics lookup directly from Nile Alamal Hospital HIS via `patientID` (accepts MRN or National ID). Automatically populates Arabic/English names, National ID, Age, Date of Birth, Gender, Primary and Secondary Phone Numbers, Governorate/Nationality, Religion, and Marital Status.
- **Streamlined Single-Input Form**: Simplified patient intake workflow eliminating redundant identification inputs; users can simply enter the Patient ID / MRN and press Enter to auto-populate all demographics.
- **Complete Patient Visit History (`/api/nile/patient-visits`)**: Fetches full visit logs without truncation—including past clinic consultations and upcoming/scheduled future visits—with visit number, type, dates, clinic name, doctor, and specialty.
- **Automatic Database Synchronization**: Automatically persists visits directly into `cases.patient_visits` (JSON column) whenever visits are fetched for existing cases or when submitting a case form.
- **55-Minute Token Caching**: Transparent OAuth token lifecycle management in `NileApiService` to prevent redundant authentication overhead while maintaining 100% uptime with the hospital network.

### 📊 6. Analytics & Clinical Workload Insights
- Real-time case distribution charts across specialties.
- Alarms breakdown, stalled case monitoring, and surgery pipeline analytics.
- Departmental workload and surgical readiness metrics.

### 🛡️ 7. Session Security & API Resilience
- **Automated 401 Session Interceptor**: Handles expired or invalid tokens seamlessly with automatic logout and redirect.
- **Structured Error Handling**: Unified JSON exception handling across all Laravel API endpoints.
- **IIS Production Routing**: Built-in `web.config` rewrite rules for client-side SPA routing and backend proxying.

---

## 🏗️ Project Architecture

```
Master_Hub/
├── README.md                               # Project documentation
├── web.config                              # Root IIS URL Rewrite configuration
├── index.html                              # Legacy / static fallback index
├── logo.jpg / favicon.ico                  # Brand icons and assets
│
├── Backend-laravel/                        # Laravel 11 Backend API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── AuthController.php          # Login, Register, User Management
│   │   │   ├── CasesController.php         # Complete Case CRUD, Filters, Dept Sync
│   │   │   ├── NileVerificationController.php # Nile HIS Personal Summary & Visits
│   │   │   └── UserController.php          # Admin user management
│   │   ├── Models/
│   │   │   ├── CASES.php                   # Master Case model & accessors
│   │   │   ├── Department.php              # Department dictionary model
│   │   │   ├── PatientVisit.php            # Relational patient visits model
│   │   │   ├── User.php                    # User model with multi-department roles
│   │   │   └── Dept/                       # 20 Individual Department models
│   │   └── Services/
│   │       └── NileApiService.php          # Nile Alamal HIS HTTP client & token cache
│   ├── database/
│   │   ├── migrations/                     # Schema migrations
│   │   └── seeders/                        # Department & demo case seeders
│   ├── routes/
│   │   └── api.php                         # Sanctum-authenticated API routes
│   └── bootstrap/app.php                   # App configuration & JSON error handler
│
├── Frontend-react/                         # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin/                      # User & access management modals
│   │   │   ├── Analytics/                  # Analytics dashboards & stats
│   │   │   ├── Anesthesia/                 # Pre-op anesthesia evaluation list
│   │   │   ├── Dashboard/                  # Global Directory & Case Cards
│   │   │   ├── Layout/                     # Header, Sidebar, Navigation
│   │   │   ├── PatientForm/                # Dynamic multi-department medical form
│   │   │   └── Surgery/                    # Surgical list & OR management
│   │   ├── context/
│   │   │   └── AppContext.tsx              # Global state, Auth, Cases provider
│   │   ├── utils/
│   │   │   ├── api.ts                      # Axios/fetch client with interceptors
│   │   │   ├── apiMapper.ts                # Snake_case <-> camelCase transformer
│   │   │   └── departmentsData.ts          # Department registry & form metadata
│   │   ├── index.css                       # Vanilla CSS clinical design system
│   │   └── main.tsx                        # Application entry point
│   ├── public/
│   │   └── web.config                      # SPA client rewrite rules for IIS
│   ├── package.json
│   └── vite.config.ts
│
└── deploy/                                 # Server & IIS Deployment Suite
    ├── FULL_SETUP.ps1                      # Automated Windows Server setup
    ├── setup_server.ps1                    # Interactive server bootstrap
    ├── deploy.ps1                          # Git webhook continuous deployment
    ├── webhook_receiver.ps1                # Webhook listener daemon (Port 9000)
    ├── install_service.ps1                 # NSSM service installer
    └── SERVER_SETUP.md                     # Detailed deployment handbook
```

---

## 📡 Nile HIS API Endpoints Reference

The platform integrates with Nile Alamal Hospital's backend (`http://10.2.2.41/KsiApi`):

| Endpoint | Method | Payload | Description |
| :--- | :---: | :--- | :--- |
| `/api/nile/personal-summary` | `POST` | `{"patientID": "20250883"}` | Fetches patient demographics (names, age, DOB, phones, national ID) from HIS. |
| `/api/nile/patient-visits` | `POST` | `{"patientID": "20250883"}` | Returns all visits (past + upcoming) in raw format `{"visits": [...], "error": null}` and auto-saves to DB. |
| `/api/nile/sync-patient-visits` | `POST` | `{"patientID": "20250883"}` or `{"case_id": 3}` | Synchronizes visits and returns updated case record. |
| `/api/nile/verify-patient` | `POST` | `{"patientID": "20250883"}` | Legacy endpoint maintained for backwards compatibility. |
| `/api/PCC_integrate_with_PP` | `POST` | `{"mrn": "...", "national_id": "...", "date_of_birth": "..."}` | Patient Portal (PP) live integration endpoint. Authenticates patient using 3 credentials and returns full demographics plus complete visits timeline. |

---

## 🚀 Getting Started

### Prerequisites
- **PHP 8.2+** with extensions: `pdo_mysql`, `mbstring`, `openssl`, `curl`, `gd`, `fileinfo`, `zip`, `intl`
- **Node.js (LTS)** & `npm`
- **Composer**
- **MySQL 8.0**
- **IIS** (Windows Server) with URL Rewrite & Application Request Routing (ARR) modules

---

### Database Setup for Patient Visits
To support storing hospital visits history locally, execute these SQL statements on your database:

```sql
-- 1. Add JSON column to cases table (if not already present)
ALTER TABLE `cases` ADD COLUMN `patient_visits` JSON NULL AFTER `programs`;

-- 2. Create composite index for instantaneous 3-field patient portal authentication
CREATE INDEX `idx_cases_pp_auth` ON `cases` (`mrn`, `national_id`, `date_of_birth`);

-- 3. Dedicated relational table for visits history
CREATE TABLE IF NOT EXISTS `patient_visits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `case_id` BIGINT UNSIGNED NOT NULL,
  `mrn` VARCHAR(255) NOT NULL,
  `visit_number` INT DEFAULT NULL,
  `visit_type_ar` VARCHAR(255) DEFAULT NULL,
  `visit_type_en` VARCHAR(255) DEFAULT NULL,
  `visit_start_date` VARCHAR(100) DEFAULT NULL,
  `visit_end_date` VARCHAR(100) DEFAULT NULL,
  `place_name_ar` VARCHAR(255) DEFAULT NULL,
  `place_name_en` VARCHAR(255) DEFAULT NULL,
  `doctor_name_ar` VARCHAR(255) DEFAULT NULL,
  `doctor_name_en` VARCHAR(255) DEFAULT NULL,
  `doctor_specialty_ar` VARCHAR(255) DEFAULT NULL,
  `doctor_specialty_en` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_patient_visits_case_id` (`case_id`),
  KEY `idx_patient_visits_mrn` (`mrn`),
  CONSTRAINT `fk_patient_visits_case_id` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Local Development Setup

#### 1. Backend (Laravel API)
```bash
cd Backend-laravel

# Create environment file
cp .env.example .env

# Configure database & Nile HIS credentials in .env:
# DB_HOST=127.0.0.1
# DB_DATABASE=master_hub
# DB_USERNAME=root
# DB_PASSWORD=your_password
#
# NILE_API_BASE_URL=http://10.2.2.41/KsiApi
# NILE_API_USERNAME=your_username
# NILE_API_PASSWORD=your_password

# Install PHP dependencies
composer install

# Generate application key & run migrations
php artisan key:generate
php artisan migrate --seed
php artisan storage:link

# Start development server
php artisan serve --port=8000
# API base URL: http://localhost:8000/api
```

#### 2. Frontend (React + Vite)
```bash
cd Frontend-react

# Install npm dependencies
npm install

# Start development server
npm run dev
# App will open at: http://localhost:5173
```

#### 3. Building for Production
```bash
cd Frontend-react
npm run build
# Production assets will be generated in Frontend-react/dist/
```

---

## 🌐 Production Deployment (IIS & CI/CD)

The project includes an automated deployment suite for Windows Server running IIS:

1. **One-Time Server Setup**:
   ```powershell
   # Run as Administrator
   Set-ExecutionPolicy Bypass -Scope Process -Force
   cd C:\path\to\Master_Hub\deploy
   .\FULL_SETUP.ps1
   ```
2. **Automated CI/CD Webhook**:
   - Pushes to the `main` branch trigger `webhook_receiver.ps1` (port 9000).
   - Automatically pulls changes, runs migrations, builds the React app, and recycles the IIS App Pool.

For full server configuration details, consult [`deploy/SERVER_SETUP.md`](deploy/SERVER_SETUP.md).

---

## 🔒 Security & Best Practices
- **Authentication**: Laravel Sanctum bearer token authentication.
- **Authorization**: Role-based access control (`admin`, `staff`, `coordinator`) and department access constraints.
- **Audit Trails**: Full tracking of record creators and modifiers (`created_by`, `updated_by`).
- **Data Integrity**: Foreign key cascade management and atomic transactions across department syncs.

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/clinical-enhancement`)
3. Commit your changes (`git commit -m "Add new clinical module"`)
4. Push to the branch (`git push origin feature/clinical-enhancement`)
5. Open a Pull Request

---

© 2026 Master Hub — Patient Coordinator Center (PCC). All rights reserved.
