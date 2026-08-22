# =============================================================================
#  Master Hub -- FULL SERVER SETUP (No Docker)
#  Run as Administrator. Just runs straight through, no prompts.
#  USAGE:
#    Set-ExecutionPolicy Bypass -Scope Process -Force
#    .\FULL_SETUP.ps1
# =============================================================================

$REPO_URL    = "https://github.com/Mo-Mn3em/Master_Hub.git"
$DEPLOY_PATH = "C:\inetpub\master_hub"

function Write-Step { param([string]$T) Write-Host "" ; Write-Host "=== $T ===" -ForegroundColor Cyan }
function Write-Ok   { param([string]$T) Write-Host "[OK]   $T" -ForegroundColor Green }
function Write-Warn { param([string]$T) Write-Host "[WARN] $T" -ForegroundColor Yellow }
function Write-Fail { param([string]$T) Write-Host "[FAIL] $T" -ForegroundColor Red ; exit 1 }
function Write-Info { param([string]$T) Write-Host "[INFO] $T" -ForegroundColor White }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Fail "Run PowerShell as Administrator!" }

# Find git.exe (already installed)
$gitCmd = $null
foreach ($p in @("git","C:\Program Files\Git\cmd\git.exe","C:\Users\$env:USERNAME\AppData\Local\Programs\Git\cmd\git.exe")) {
    try { $null = & $p --version 2>&1 ; if ($LASTEXITCODE -eq 0) { $gitCmd = $p ; break } } catch {}
}
if (-not $gitCmd) { Write-Fail "Git not found. Install Git first from https://git-scm.com/download/win" }
Write-Ok "Git found: $gitCmd"

# =============================================================================
# STEP 1 -- IIS + URL Rewrite + ARR
# =============================================================================
Write-Step "STEP 1/6 - IIS + URL Rewrite + ARR"

$iisOk     = (Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue).Installed
$rewriteOk = Test-Path "$env:SystemRoot\system32\inetsrv\rewrite.dll"
$arrOk     = Test-Path "$env:ProgramFiles\IIS\Application Request Routing"

if (-not $iisOk) {
    Write-Info "Installing IIS..."
    Install-WindowsFeature -Name Web-Server, Web-Mgmt-Tools, Web-Http-Redirect, Web-CGI -IncludeManagementTools | Out-Null
    Write-Ok "IIS installed."
} else { Write-Ok "IIS already installed." }

if (-not $rewriteOk) {
    Write-Info "Installing URL Rewrite..."
    $rwMsi = "$env:TEMP\rewrite.msi"
    Invoke-WebRequest -Uri "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi" -OutFile $rwMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$rwMsi`" /quiet /norestart" -Wait
    Remove-Item $rwMsi -Force -ErrorAction SilentlyContinue
    Write-Ok "URL Rewrite installed."
} else { Write-Ok "URL Rewrite already installed." }

if (-not $arrOk) {
    Write-Info "Installing ARR..."
    $arrMsi = "$env:TEMP\arr.msi"
    Invoke-WebRequest -Uri "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi" -OutFile $arrMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$arrMsi`" /quiet /norestart" -Wait
    Remove-Item $arrMsi -Force -ErrorAction SilentlyContinue
    Write-Ok "ARR installed."
} else { Write-Ok "ARR already installed." }

$appCmd = "$env:SystemRoot\system32\inetsrv\appcmd.exe"
if (Test-Path $appCmd) {
    & $appCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost 2>&1 | Out-Null
    Write-Ok "ARR proxy enabled."
}

# =============================================================================
# STEP 2 -- Clone Repository
# =============================================================================
Write-Step "STEP 2/6 - Clone Repository"

if (Test-Path "$DEPLOY_PATH\.git") {
    Write-Ok "Repo already cloned at $DEPLOY_PATH. Pulling latest..."
    Set-Location $DEPLOY_PATH
    & $gitCmd pull origin main
} else {
    Write-Info "Cloning repo to $DEPLOY_PATH ..."
    & $gitCmd clone $REPO_URL $DEPLOY_PATH
    if ($LASTEXITCODE -ne 0) { Write-Fail "git clone failed. Check network access to GitHub." }
    Write-Ok "Repository cloned."
}

# =============================================================================
# STEP 3 -- Configure .env
# =============================================================================
Write-Step "STEP 3/6 - Configure .env"

$envPath = "$DEPLOY_PATH\Backend-laravel\.env"
if (-not (Test-Path $envPath)) {
    Write-Info "Creating .env from example..."
    Copy-Item "$DEPLOY_PATH\Backend-laravel\.env.example" $envPath
    Write-Ok ".env created. Edit it now to set DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD, APP_URL, etc."
    Write-Warn "Update $envPath with your real database credentials before continuing."
    Read-Host "Press Enter after editing .env to continue..."
} else {
    Write-Ok ".env already exists."
}

# =============================================================================
# STEP 4 -- Install dependencies & build
# =============================================================================
Write-Step "STEP 4/6 - Install Dependencies and Build"

Write-Info "Installing Composer dependencies..."
Set-Location "$DEPLOY_PATH\Backend-laravel"
& composer install --no-dev --optimize-autoloader
if ($LASTEXITCODE -ne 0) { Write-Warn "composer install had errors." } else { Write-Ok "Composer done." }

Write-Info "Running Laravel setup commands..."
& php artisan key:generate --force
& php artisan migrate --force
& php artisan storage:link --force
& php artisan config:cache
& php artisan route:cache
& php artisan view:cache
Write-Ok "Laravel setup done."

Write-Info "Building React frontend..."
Set-Location "$DEPLOY_PATH\Frontend-react"
& npm install
& npm run build
if ($LASTEXITCODE -ne 0) { Write-Warn "npm build had errors." } else { Write-Ok "Frontend build done." }

# =============================================================================
# STEP 5 -- IIS Site + SSL Certificate
# =============================================================================
Write-Step "STEP 5/6 - IIS Site + SSL"

Import-Module WebAdministration -ErrorAction SilentlyContinue

if (-not (Get-Website -Name "MasterHub" -ErrorAction SilentlyContinue)) {
    Write-Info "Creating self-signed SSL certificate (5 years)..."
    $cert  = New-SelfSignedCertificate -DnsName "master-hub-server","localhost" `
                 -CertStoreLocation "cert:\LocalMachine\My" `
                 -FriendlyName "MasterHub SSL" `
                 -NotAfter (Get-Date).AddYears(5)
    $thumb = $cert.Thumbprint

    Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
    New-Website -Name "MasterHub" -PhysicalPath $DEPLOY_PATH -Port 443 -Ssl | Out-Null
    $b = Get-WebBinding -Name "MasterHub" -Protocol "https"
    if ($b) { $b.AddSslCertificate($thumb, "My") }
    New-WebBinding -Name "MasterHub" -Protocol "http" -Port 80
    Start-Website -Name "MasterHub"
    Write-Ok "IIS site MasterHub created on ports 80 (HTTP) and 443 (HTTPS)."
} else {
    Write-Ok "IIS site MasterHub already exists."
}

# =============================================================================
# STEP 6 -- Webhook Service
# =============================================================================
Write-Step "STEP 6/6 - Webhook Service"

$svc = Get-Service -Name "MasterHubWebhook" -ErrorAction SilentlyContinue
if (-not $svc) {
    $svcScript = "$DEPLOY_PATH\deploy\install_service.ps1"
    if (Test-Path $svcScript) {
        Write-Info "Installing webhook Windows service..."
        & powershell.exe -ExecutionPolicy Bypass -File $svcScript
        Write-Ok "Webhook service installed."
    } else {
        Write-Warn "install_service.ps1 not found in repo."
    }
} else {
    Write-Ok "Webhook service already installed (Status: $($svc.Status))."
}

# =============================================================================
# DONE
# =============================================================================
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notmatch "^127\." -and $_.IPAddress -notmatch "^169\." } |
    Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Access from any device on the network:" -ForegroundColor Cyan
Write-Host "  Frontend   : https://$ip/" -ForegroundColor White
Write-Host "  API        : https://$ip/api/" -ForegroundColor White
Write-Host ""
Write-Host "3 manual steps remaining:" -ForegroundColor Yellow
Write-Host "  1. Set WEBHOOK_SECRET in: $DEPLOY_PATH\deploy\webhook_receiver.ps1" -ForegroundColor White
Write-Host "  2. Run: Restart-Service MasterHubWebhook" -ForegroundColor White
Write-Host "  3. Add GitHub Webhook -> http://${ip}:9000/deploy/" -ForegroundColor White
Write-Host "     (GitHub repo -> Settings -> Webhooks -> Add webhook)" -ForegroundColor Gray
