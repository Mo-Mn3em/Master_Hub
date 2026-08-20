# =============================================================================
#  Master Hub -- FULL SERVER SETUP
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
# STEP 1 -- Enable WSL2 Windows Features (reboots if not already enabled)
# =============================================================================
Write-Step "STEP 1/7 - Enable WSL2 Features"

$wslState = (Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -ErrorAction SilentlyContinue).State
$vmState  = (Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -ErrorAction SilentlyContinue).State

if ($wslState -eq "Enabled" -and $vmState -eq "Enabled") {
    Write-Ok "WSL2 features already enabled. Skipping."
} else {
    Write-Info "Enabling Containers feature..."
    Enable-WindowsOptionalFeature -Online -FeatureName containers -All -NoRestart | Out-Null
    Write-Info "Enabling WSL feature..."
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Out-Null
    Write-Info "Enabling VirtualMachinePlatform..."
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Out-Null
    Write-Ok "Features enabled."
    Write-Warn "SERVER MUST REBOOT. After reboot, run this script again."
    Start-Sleep -Seconds 3
    Restart-Computer -Force
    exit
}

# =============================================================================
# STEP 2 -- WSL2 Kernel Update + Ubuntu
# =============================================================================
Write-Step "STEP 2/7 - WSL2 Kernel and Ubuntu"

$wslKernelOk = $false
try { $null = wsl --list --verbose 2>&1 ; if ($LASTEXITCODE -eq 0) { $wslKernelOk = $true } } catch {}

if ($wslKernelOk) {
    Write-Ok "WSL2 kernel already installed. Skipping."
} else {
    Write-Info "Downloading WSL2 kernel update..."
    $wslMsi = "$env:TEMP\wsl_update.msi"
    Invoke-WebRequest -Uri "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi" -OutFile $wslMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$wslMsi`" /quiet /norestart" -Wait
    Remove-Item $wslMsi -Force -ErrorAction SilentlyContinue
    wsl --set-default-version 2 | Out-Null
    Write-Info "Installing Ubuntu (2-3 min)..."
    wsl --install -d Ubuntu --no-launch | Out-Null
    Write-Ok "WSL2 kernel and Ubuntu installed."
}

# =============================================================================
# STEP 3 -- Docker Engine + Docker Compose (replaces Docker Desktop)
# =============================================================================
Write-Step "STEP 3/7 - Docker Engine and Docker Compose"

$dockerOk = $false
try { $null = & docker --version 2>&1 ; if ($LASTEXITCODE -eq 0) { $dockerOk = $true } } catch {}

if ($dockerOk) {
    Write-Ok "Docker already installed: $(& docker --version 2>&1)"
} else {
    Write-Info "Installing DockerMsftProvider module..."
    Install-Module -Name DockerMsftProvider -Repository PSGallery -Force -SkipPublisherCheck

    Write-Info "Installing Docker Engine (3-5 minutes)..."
    Install-Package -Name docker -ProviderName DockerMsftProvider -Force -RequiredVersion 20.10.9

    Start-Service docker
    Set-Service -Name docker -StartupType Automatic

    Write-Info "Waiting for Docker to start..."
    $count = 0
    while ($count -lt 20) {
        $null = & docker info 2>&1
        if ($LASTEXITCODE -eq 0) { break }
        $count++ ; Start-Sleep -Seconds 5
    }
    Write-Ok "Docker Engine running."

    Write-Info "Installing Docker Compose v2..."
    $composePath = "C:\Program Files\Docker\cli-plugins"
    New-Item -ItemType Directory -Path $composePath -Force | Out-Null
    Invoke-WebRequest `
        -Uri "https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-windows-x86_64.exe" `
        -OutFile "$composePath\docker-compose.exe" `
        -UseBasicParsing
    Write-Ok "Docker Compose v2 installed."
}

# =============================================================================
# STEP 4 -- IIS + URL Rewrite + ARR
# =============================================================================
Write-Step "STEP 4/7 - IIS + URL Rewrite + ARR"

$iisOk     = (Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue).Installed
$rewriteOk = Test-Path "$env:SystemRoot\system32\inetsrv\rewrite.dll"
$arrOk     = Test-Path "$env:ProgramFiles\IIS\Application Request Routing"

if (-not $iisOk) {
    Write-Info "Installing IIS..."
    Install-WindowsFeature -Name Web-Server, Web-Mgmt-Tools, Web-Http-Redirect -IncludeManagementTools | Out-Null
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
# STEP 5 -- Clone Repository
# =============================================================================
Write-Step "STEP 5/7 - Clone Repository"

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
# STEP 6 -- Configure .env and Start Docker Containers
# =============================================================================
Write-Step "STEP 6/7 - Configure .env and Start Containers"

$envPath = "$DEPLOY_PATH\Backend-laravel\.env"
if (-not (Test-Path $envPath)) {
    Write-Info "Creating .env from example..."
    Copy-Item "$DEPLOY_PATH\Backend-laravel\.env.example" $envPath
    $c = Get-Content $envPath
    $c = $c -replace "DB_CONNECTION=.*",  "DB_CONNECTION=mysql"
    $c = $c -replace "# DB_HOST=.*",      "DB_HOST=db"
    $c = $c -replace "# DB_PORT=.*",      "DB_PORT=3306"
    $c = $c -replace "# DB_DATABASE=.*",  "DB_DATABASE=Master_Hub"
    $c = $c -replace "# DB_USERNAME=.*",  "DB_USERNAME=root"
    $c = $c -replace "# DB_PASSWORD=.*",  "DB_PASSWORD=root"
    $c | Set-Content $envPath
    Write-Ok ".env configured."
} else {
    Write-Ok ".env already exists."
}

Write-Info "Starting all 4 Docker containers (first run: 5-10 minutes)..."
Set-Location $DEPLOY_PATH
& docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
    Write-Warn "docker compose had errors. Check with: docker compose logs"
} else {
    Write-Ok "All 4 containers started."
}

Write-Info "Running containers:"
& docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# =============================================================================
# STEP 7 -- IIS Site + SSL Certificate + Webhook Service
# =============================================================================
Write-Step "STEP 7/7 - IIS Site + SSL + Webhook Service"

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
Write-Host "  phpMyAdmin : https://$ip/phpmyadmin/" -ForegroundColor White
Write-Host ""
Write-Host "3 manual steps remaining:" -ForegroundColor Yellow
Write-Host "  1. Set WEBHOOK_SECRET in: $DEPLOY_PATH\deploy\webhook_receiver.ps1" -ForegroundColor White
Write-Host "  2. Run: Restart-Service MasterHubWebhook" -ForegroundColor White
Write-Host "  3. Add GitHub Webhook -> http://${ip}:9000/deploy/" -ForegroundColor White
Write-Host "     (GitHub repo -> Settings -> Webhooks -> Add webhook)" -ForegroundColor Gray
