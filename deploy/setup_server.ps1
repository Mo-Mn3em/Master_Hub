# =============================================================================
#  Master Hub — One-Time Server Bootstrap Script
#  Run this ONCE on a fresh Windows Server as Administrator.
#  It sets up everything needed to host Master Hub via IIS + Docker.
#
#  USAGE:
#    Right-click PowerShell → "Run as Administrator"
#    Set-ExecutionPolicy Bypass -Scope Process -Force
#    .\setup_server.ps1
# =============================================================================

$REPO_URL      = "git@github.com:Mo-Mn3em/Master_Hub.git"
$DEPLOY_PATH   = "C:\inetpub\master_hub"
$SSH_KEY_PATH  = "C:\Users\$env:USERNAME\.ssh\master_hub_deploy"
$KNOWN_HOSTS   = "C:\Users\$env:USERNAME\.ssh\known_hosts"
$SSH_DIR       = "C:\Users\$env:USERNAME\.ssh"

# ─────────────────────────────────────────────────────────────────────────────
function Write-Step   { param([string]$T) Write-Host "`n[STEP] $T" -ForegroundColor Cyan }
function Write-Ok     { param([string]$T) Write-Host "  [OK] $T" -ForegroundColor Green }
function Write-Warn   { param([string]$T) Write-Host "  [WARN] $T" -ForegroundColor Yellow }
function Write-Fail   { param([string]$T) Write-Host "  [FAIL] $T" -ForegroundColor Red; exit 1 }
function Write-Manual { param([string]$T) Write-Host "  [MANUAL] $T" -ForegroundColor Magenta }
# ─────────────────────────────────────────────────────────────────────────────

# ── 0. Administrator check ────────────────────────────────────────────────────
Write-Step "Checking Administrator privileges"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Fail "Run as Administrator!" }
Write-Ok "Running as Administrator."

# ── 1. Check Git ──────────────────────────────────────────────────────────────
Write-Step "Checking Git installation"
try {
    $gitVer = & git --version 2>&1
    Write-Ok "Git found: $gitVer"
} catch {
    Write-Fail "Git is not installed. Download from https://git-scm.com/download/win"
}

# ── 2. Check Docker ───────────────────────────────────────────────────────────
Write-Step "Checking Docker installation"
try {
    $dockerVer = & docker --version 2>&1
    Write-Ok "Docker found: $dockerVer"
    $composeVer = & docker compose version 2>&1
    Write-Ok "Docker Compose: $composeVer"
} catch {
    Write-Fail "Docker is not installed or not running. Download Docker Desktop from https://www.docker.com/products/docker-desktop/"
}

# ── 3. Check IIS Modules ──────────────────────────────────────────────────────
Write-Step "Checking IIS URL Rewrite & ARR modules"
$arrPath     = "$env:ProgramFiles\IIS\Application Request Routing"
$rewritePath = "$env:SystemRoot\system32\inetsrv\rewrite.dll"

if (-not (Test-Path $rewritePath)) {
    Write-Warn "IIS URL Rewrite module NOT found."
    Write-Manual "Download and install: https://www.iis.net/downloads/microsoft/url-rewrite"
} else {
    Write-Ok "IIS URL Rewrite module found."
}

if (-not (Test-Path $arrPath)) {
    Write-Warn "IIS Application Request Routing (ARR) NOT found."
    Write-Manual "Download and install: https://www.iis.net/downloads/microsoft/application-request-routing"
} else {
    Write-Ok "IIS ARR module found."
}

# ── 4. Generate SSH Deploy Key ────────────────────────────────────────────────
Write-Step "Setting up SSH Deploy Key for private GitHub repo"

if (-not (Test-Path $SSH_DIR)) {
    New-Item -ItemType Directory -Path $SSH_DIR -Force | Out-Null
}

if (Test-Path "$SSH_KEY_PATH") {
    Write-Ok "SSH Deploy Key already exists at $SSH_KEY_PATH"
} else {
    Write-Host "  Generating new SSH key pair..." -ForegroundColor Yellow
    & ssh-keygen -t ed25519 -C "master_hub_deploy_key" -f $SSH_KEY_PATH -N '""'

    if ($LASTEXITCODE -ne 0) {
        Write-Fail "ssh-keygen failed. Make sure OpenSSH is installed (Windows Feature)."
    }
    Write-Ok "SSH key generated at $SSH_KEY_PATH"
}

# Add github.com to known_hosts (prevents interactive prompt on first git pull)
Write-Step "Adding github.com to SSH known_hosts"
$githubKey = & ssh-keyscan -t ed25519 github.com 2>$null
if ($githubKey) {
    if (-not (Select-String -Path $KNOWN_HOSTS -Pattern "github.com" -Quiet -ErrorAction SilentlyContinue)) {
        Add-Content -Path $KNOWN_HOSTS -Value $githubKey
        Write-Ok "github.com added to known_hosts."
    } else {
        Write-Ok "github.com already in known_hosts."
    }
} else {
    Write-Warn "Could not reach github.com for ssh-keyscan. Skipping known_hosts setup."
}

# ── 5. Show public key — User must add this to GitHub ─────────────────────────
Write-Step "ACTION REQUIRED: Add this Deploy Key to GitHub"
$pubKey = Get-Content "$SSH_KEY_PATH.pub"
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "  │  Copy this public key and add it to GitHub:                         │" -ForegroundColor Magenta
Write-Host "  │  Repo → Settings → Deploy Keys → Add Deploy Key                     │" -ForegroundColor Magenta
Write-Host "  │  Title: MasterHub Server Deploy Key                                 │" -ForegroundColor Magenta
Write-Host "  │  Allow write access: NO (read-only is safer)                        │" -ForegroundColor Magenta
Write-Host "  └─────────────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta
Write-Host ""
Write-Host "  $pubKey" -ForegroundColor White
Write-Host ""

# Configure SSH to use this specific key for github.com
$sshConfig = "$SSH_DIR\config"
$sshConfigEntry = @"

Host github.com
  HostName github.com
  User git
  IdentityFile $SSH_KEY_PATH
  IdentitiesOnly yes
"@

if (-not (Select-String -Path $sshConfig -Pattern "master_hub" -Quiet -ErrorAction SilentlyContinue)) {
    Add-Content -Path $sshConfig -Value $sshConfigEntry
    Write-Ok "SSH config updated to use deploy key for github.com."
} else {
    Write-Ok "SSH config already configured."
}

# ── 6. Clone the repository ───────────────────────────────────────────────────
Write-Step "Cloning Master Hub repository to $DEPLOY_PATH"
Write-Host "  IMPORTANT: Press Enter when you have added the Deploy Key to GitHub." -ForegroundColor Yellow
Read-Host "  Press Enter to continue..."

if (Test-Path "$DEPLOY_PATH\.git") {
    Write-Ok "Repository already cloned at $DEPLOY_PATH. Skipping clone."
} else {
    if (Test-Path $DEPLOY_PATH) {
        Remove-Item $DEPLOY_PATH -Recurse -Force
    }

    & git clone $REPO_URL $DEPLOY_PATH
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "git clone failed. Make sure you added the Deploy Key to GitHub and have network access."
    }
    Write-Ok "Repository cloned to $DEPLOY_PATH"
}

# ── 7. Create .env file from example ─────────────────────────────────────────
Write-Step "Setting up .env for Laravel backend"
$envPath    = "$DEPLOY_PATH\Backend-laravel\.env"
$envExample = "$DEPLOY_PATH\Backend-laravel\.env.example"

if (Test-Path $envPath) {
    Write-Ok ".env already exists. Skipping."
} else {
    Copy-Item $envExample $envPath
    Write-Ok ".env created from .env.example."
    Write-Warn "Review $envPath and update APP_URL, any API keys, mail settings, etc."
}

# ── 8. Start Docker containers for the first time ────────────────────────────
Write-Step "Starting Docker containers (first run — this may take a few minutes)"
Set-Location $DEPLOY_PATH
& docker compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Warn "docker compose up returned non-zero. Check logs: docker compose logs"
} else {
    Write-Ok "Docker containers started."
}

# ── 9. Install webhook Windows Service ────────────────────────────────────────
Write-Step "Installing GitHub Webhook Windows Service"
& "$DEPLOY_PATH\deploy\install_service.ps1"

# ── 10. Final checklist ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "  MASTER HUB SERVER SETUP COMPLETE — Manual Steps Remaining  " -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  STILL TODO (manual steps in IIS Manager):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [1] Install IIS URL Rewrite module (if not already done):" -ForegroundColor White
Write-Host "      https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Gray
Write-Host ""
Write-Host "  [2] Install IIS Application Request Routing (ARR):" -ForegroundColor White
Write-Host "      https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor Gray
Write-Host ""
Write-Host "  [3] Enable ARR Proxy in IIS Manager:" -ForegroundColor White
Write-Host "      IIS Manager → Server level → Application Request Routing Cache" -ForegroundColor Gray
Write-Host "      → Enable proxy → Apply" -ForegroundColor Gray
Write-Host ""
Write-Host "  [4] Create IIS Site:" -ForegroundColor White
Write-Host "      IIS Manager → Sites → Add Website" -ForegroundColor Gray
Write-Host "      Site name  : MasterHub" -ForegroundColor Gray
Write-Host "      Physical path: C:\inetpub\master_hub" -ForegroundColor Gray
Write-Host "      Binding    : HTTPS, port 443" -ForegroundColor Gray
Write-Host "      SSL cert   : (select your cert or create a self-signed one)" -ForegroundColor Gray
Write-Host ""
Write-Host "  [5] Set webhook secret in webhook_receiver.ps1:" -ForegroundColor White
Write-Host "      Edit: $DEPLOY_PATH\deploy\webhook_receiver.ps1" -ForegroundColor Gray
Write-Host "      Line: `$WEBHOOK_SECRET = 'REPLACE_WITH_YOUR_WEBHOOK_SECRET'" -ForegroundColor Gray
Write-Host "      Then: Restart-Service MasterHubWebhook" -ForegroundColor Gray
Write-Host ""
Write-Host "  [6] Add GitHub Webhook:" -ForegroundColor White
Write-Host "      GitHub Repo → Settings → Webhooks → Add webhook" -ForegroundColor Gray
Write-Host "      Payload URL : http://<YOUR_SERVER_IP>:9000/deploy/" -ForegroundColor Gray
Write-Host "      Content type: application/json" -ForegroundColor Gray
Write-Host "      Secret      : (same as WEBHOOK_SECRET in webhook_receiver.ps1)" -ForegroundColor Gray
Write-Host "      Events      : Just the push event" -ForegroundColor Gray
Write-Host ""
Write-Host "  Docker containers running:" -ForegroundColor Cyan
& docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""
