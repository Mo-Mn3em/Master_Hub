# =============================================================================
#  Master Hub — Deploy Script
#  Called by webhook_receiver.ps1 after a verified GitHub push to main.
#  1. git pull origin main  (using SSH Deploy Key)
#  2. docker compose up --build -d
#  3. docker image prune -f  (clean up dangling images)
# =============================================================================

$REPO_PATH = "C:\inetpub\master_hub"
$LOG_FILE  = "C:\inetpub\master_hub\deploy\logs\deploy.log"

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

# ── 2. docker compose up --build -d ──────────────────────────────────────────
Write-Log "Running: docker compose up --build -d"
$composeOutput = & docker compose up --build -d 2>&1
$composeOutput | ForEach-Object { Write-Log "$_" }

if ($LASTEXITCODE -ne 0) {
    Write-Log "docker compose up FAILED with exit code $LASTEXITCODE" "ERROR"
    exit 1
}
Write-Log "docker compose up succeeded."

# ── 3. Prune dangling images ──────────────────────────────────────────────────
Write-Log "Running: docker image prune -f"
$pruneOutput = & docker image prune -f 2>&1
$pruneOutput | ForEach-Object { Write-Log "$_" }
Write-Log "Image prune done."

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Log "=========================================="
Write-Log "Deploy finished successfully at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log "=========================================="
