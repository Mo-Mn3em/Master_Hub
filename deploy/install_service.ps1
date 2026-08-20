# =============================================================================
#  Master Hub — Windows Service Installer for Webhook Receiver
#  Run this script ONCE on the server as Administrator.
#  Uses NSSM (Non-Sucking Service Manager) to register the webhook listener
#  as a persistent Windows Service that auto-starts on boot.
# =============================================================================
#  USAGE:
#    Right-click PowerShell → "Run as Administrator"
#    cd C:\inetpub\master_hub\deploy
#    .\install_service.ps1
# =============================================================================

$SERVICE_NAME    = "MasterHubWebhook"
$SERVICE_DISPLAY = "Master Hub — GitHub Webhook Receiver"
$SERVICE_DESC    = "Listens for GitHub push webhooks and triggers auto-deploy of Master Hub."
$SCRIPT_PATH     = "C:\inetpub\master_hub\deploy\webhook_receiver.ps1"
$LOG_DIR         = "C:\inetpub\master_hub\deploy\logs"
$NSSM_DIR        = "C:\tools\nssm"
$NSSM_EXE        = "$NSSM_DIR\win64\nssm.exe"
$NSSM_ZIP_URL    = "https://nssm.cc/release/nssm-2.24.zip"
$NSSM_ZIP_PATH   = "C:\tools\nssm-2.24.zip"

function Write-Step {
    param([string]$Text)
    Write-Host "`n[STEP] $Text" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Text)
    Write-Host "  [FAIL] $Text" -ForegroundColor Red
    exit 1
}

# ── Must run as Administrator ──────────────────────────────────────────────────
Write-Step "Checking Administrator privileges"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Fail "This script must be run as Administrator. Right-click PowerShell and choose 'Run as Administrator'."
}
Write-Success "Running as Administrator."

# ── Ensure log directory exists ────────────────────────────────────────────────
Write-Step "Creating log directory at $LOG_DIR"
New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null
Write-Success "Log directory ready."

# ── Check / Download NSSM ──────────────────────────────────────────────────────
Write-Step "Checking for NSSM (Non-Sucking Service Manager)"

if (-not (Test-Path $NSSM_EXE)) {
    Write-Host "  NSSM not found. Downloading from $NSSM_ZIP_URL ..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Path $NSSM_DIR -Force | Out-Null

    try {
        Invoke-WebRequest -Uri $NSSM_ZIP_URL -OutFile $NSSM_ZIP_PATH -UseBasicParsing
        Expand-Archive -Path $NSSM_ZIP_PATH -DestinationPath "C:\tools" -Force
        # NSSM zip extracts to nssm-2.24\ folder
        $extractedPath = "C:\tools\nssm-2.24"
        if (Test-Path $extractedPath) {
            Rename-Item $extractedPath $NSSM_DIR -Force -ErrorAction SilentlyContinue
        }
        Remove-Item $NSSM_ZIP_PATH -Force -ErrorAction SilentlyContinue
        Write-Success "NSSM downloaded and extracted to $NSSM_DIR"
    }
    catch {
        Write-Fail "Failed to download NSSM: $_`nPlease download it manually from https://nssm.cc/download and place nssm.exe at $NSSM_EXE"
    }
} else {
    Write-Success "NSSM found at $NSSM_EXE"
}

# ── Remove existing service if it exists ──────────────────────────────────────
Write-Step "Checking for existing '$SERVICE_NAME' service"
$existingService = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "  Existing service found. Stopping and removing..." -ForegroundColor Yellow
    Stop-Service -Name $SERVICE_NAME -Force -ErrorAction SilentlyContinue
    & $NSSM_EXE remove $SERVICE_NAME confirm
    Start-Sleep -Seconds 2
    Write-Success "Old service removed."
} else {
    Write-Success "No existing service found. Proceeding with fresh install."
}

# ── Install service with NSSM ──────────────────────────────────────────────────
Write-Step "Installing '$SERVICE_NAME' Windows Service"

& $NSSM_EXE install $SERVICE_NAME powershell.exe
& $NSSM_EXE set $SERVICE_NAME AppParameters "-NonInteractive -ExecutionPolicy Bypass -File `"$SCRIPT_PATH`""
& $NSSM_EXE set $SERVICE_NAME DisplayName $SERVICE_DISPLAY
& $NSSM_EXE set $SERVICE_NAME Description $SERVICE_DESC
& $NSSM_EXE set $SERVICE_NAME Start SERVICE_AUTO_START
& $NSSM_EXE set $SERVICE_NAME AppStdout "$LOG_DIR\service_stdout.log"
& $NSSM_EXE set $SERVICE_NAME AppStderr "$LOG_DIR\service_stderr.log"
& $NSSM_EXE set $SERVICE_NAME AppStdoutCreationDisposition 4   # Append mode
& $NSSM_EXE set $SERVICE_NAME AppStderrCreationDisposition 4   # Append mode

# ── Recovery settings — restart service on failure ────────────────────────────
& $NSSM_EXE set $SERVICE_NAME AppExit Default Restart
& $NSSM_EXE set $SERVICE_NAME AppRestartDelay 5000   # 5 seconds before restart

Write-Success "Service installed."

# ── Start the service ──────────────────────────────────────────────────────────
Write-Step "Starting '$SERVICE_NAME' service"
Start-Service -Name $SERVICE_NAME
Start-Sleep -Seconds 3

$svc = Get-Service -Name $SERVICE_NAME
if ($svc.Status -eq "Running") {
    Write-Success "Service is RUNNING."
} else {
    Write-Host "  WARNING: Service status is '$($svc.Status)'. Check logs at $LOG_DIR" -ForegroundColor Yellow
}

# ── Allow port 9000 through Windows Firewall ──────────────────────────────────
Write-Step "Adding Windows Firewall rule for port 9000 (GitHub Webhooks)"
$fwRule = Get-NetFirewallRule -DisplayName "MasterHub Webhook Port 9000" -ErrorAction SilentlyContinue
if (-not $fwRule) {
    New-NetFirewallRule `
        -DisplayName "MasterHub Webhook Port 9000" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 9000 `
        -Action Allow `
        -Profile Any | Out-Null
    Write-Success "Firewall rule added."
} else {
    Write-Success "Firewall rule already exists."
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  WEBHOOK SERVICE INSTALLED SUCCESSFULLY!  " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Service Name : $SERVICE_NAME" -ForegroundColor White
Write-Host "  Listening on : http://+:9000/deploy/" -ForegroundColor White
Write-Host "  Logs at      : $LOG_DIR" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Edit webhook_receiver.ps1 and set WEBHOOK_SECRET to your GitHub secret." -ForegroundColor Yellow
Write-Host "  2. Restart the service: Restart-Service MasterHubWebhook" -ForegroundColor Yellow
Write-Host "  3. In GitHub: Settings -> Webhooks -> Add Webhook" -ForegroundColor Yellow
Write-Host "     Payload URL : http://<YOUR_SERVER_IP>:9000/deploy/" -ForegroundColor Yellow
Write-Host "     Content type: application/json" -ForegroundColor Yellow
Write-Host "     Secret      : <same value as WEBHOOK_SECRET>" -ForegroundColor Yellow
Write-Host ""
