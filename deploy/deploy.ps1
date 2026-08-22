# =============================================================================
#  Master Hub — Deploy Script
#  Called by webhook_receiver.ps1 after a verified GitHub push to main.
#  1. git pull origin main  (using SSH Deploy Key)
#  2. Install/update Composer dependencies (Laravel backend)
#  3. Run Laravel artisan commands (migrate, cache clear, etc.)
#  4. Build React frontend (npm install + npm run build)
#  5. Restart PHP/IIS app pool to pick up changes
# =============================================================================

$REPO_PATH    = "C:\inetpub\master_hub"
$BACKEND_PATH = "C:\inetpub\master_hub\Backend-laravel"
$FRONTEND_PATH= "C:\inetpub\master_hub\Frontend-react"
$LOG_FILE     = "C:\inetpub\master_hub\deploy\logs\deploy.log"
$APP_POOL     = "MasterHub"   # IIS Application Pool name

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp][$Level] $Message"
    Add-Content -Path $LOG_FILE -Value $entry
    Write-Host $entry
}

# Ensure log directory exists
$logDir = Split-Path $LOG_FILE -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

Write-Log "=========================================="
Write-Log "Deploy started"
Write-Log "=========================================="

# ── Navigate to repo ──────────────────────────────────────────────────────────
if (-not (Test-Path $REPO_PATH)) {
    Write-Log "ERROR: Repo path '$REPO_PATH' not found!" "ERROR"
    exit 1
}

Set-Location $REPO_PATH
Write-Log "Working directory: $(Get-Location)"

# ── 1. git pull ───────────────────────────────────────────────────────────────
Write-Log "Running: git pull origin main"
$gitOutput = & git pull origin main 2>&1
$gitOutput | ForEach-Object { Write-Log "$_" }

if ($LASTEXITCODE -ne 0) {
    Write-Log "git pull FAILED with exit code $LASTEXITCODE" "ERROR"
    exit 1
}
Write-Log "git pull succeeded."

# ── 2. Composer install (Laravel backend) ─────────────────────────────────────
Write-Log "Running: composer install --no-dev --optimize-autoloader"
Set-Location $BACKEND_PATH
$composerOutput = & composer install --no-dev --optimize-autoloader 2>&1
$composerOutput | ForEach-Object { Write-Log "$_" }

if ($LASTEXITCODE -ne 0) {
    Write-Log "composer install FAILED with exit code $LASTEXITCODE" "ERROR"
    exit 1
}
Write-Log "composer install succeeded."

# ── 3. Laravel artisan commands ───────────────────────────────────────────────
Write-Log "Running Laravel artisan commands..."

& php artisan migrate --force 2>&1 | ForEach-Object { Write-Log "$_" }
& php artisan config:cache 2>&1  | ForEach-Object { Write-Log "$_" }
& php artisan route:cache 2>&1   | ForEach-Object { Write-Log "$_" }
& php artisan view:cache 2>&1    | ForEach-Object { Write-Log "$_" }

Write-Log "Artisan commands done."

# ── 4. Build React frontend ───────────────────────────────────────────────────
Write-Log "Running: npm install + npm run build (frontend)"
Set-Location $FRONTEND_PATH

$npmInstall = & npm install 2>&1
$npmInstall | ForEach-Object { Write-Log "$_" }

if ($LASTEXITCODE -ne 0) {
    Write-Log "npm install FAILED with exit code $LASTEXITCODE" "ERROR"
    exit 1
}

$npmBuild = & npm run build 2>&1
$npmBuild | ForEach-Object { Write-Log "$_" }

if ($LASTEXITCODE -ne 0) {
    Write-Log "npm run build FAILED with exit code $LASTEXITCODE" "ERROR"
    exit 1
}
Write-Log "Frontend build succeeded."

# ── 5. Recycle IIS App Pool ───────────────────────────────────────────────────
Write-Log "Recycling IIS Application Pool: $APP_POOL"
try {
    Import-Module WebAdministration -ErrorAction Stop
    Restart-WebAppPool -Name $APP_POOL
    Write-Log "IIS App Pool '$APP_POOL' recycled."
} catch {
    Write-Log "Could not recycle IIS App Pool '$APP_POOL': $_" "WARN"
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Log "=========================================="
Write-Log "Deploy finished successfully at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log "=========================================="
