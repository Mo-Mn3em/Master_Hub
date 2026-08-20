# =============================================================================
#  Master Hub -- FULL SERVER SETUP SCRIPT
#  Checks what is already installed before doing anything.
#  Safe to re-run at any time.
#
#  USAGE (PowerShell as Administrator on Windows Server):
#    Set-ExecutionPolicy Bypass -Scope Process -Force
#    .\FULL_SETUP.ps1
# =============================================================================

$REPO_URL    = "https://github.com/Mo-Mn3em/Master_Hub.git"
$DEPLOY_PATH = "C:\inetpub\master_hub"
$PROGRESS    = "C:\inetpub\.setup_progress"

function Write-Step { param([string]$T) Write-Host "" ; Write-Host "=== $T ===" -ForegroundColor Cyan }
function Write-Ok   { param([string]$T) Write-Host "[OK]   $T" -ForegroundColor Green }
function Write-Skip { param([string]$T) Write-Host "[SKIP] $T - already installed." -ForegroundColor DarkGray }
function Write-Warn { param([string]$T) Write-Host "[WARN] $T" -ForegroundColor Yellow }
function Write-Fail { param([string]$T) Write-Host "[FAIL] $T" -ForegroundColor Red ; exit 1 }
function Write-Info { param([string]$T) Write-Host "[INFO] $T" -ForegroundColor White }
function Is-Done    { param([string]$S) return (Test-Path "$PROGRESS\$S") }
function Mark-Done  { param([string]$S) New-Item -ItemType File -Path "$PROGRESS\$S" -Force | Out-Null }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Fail "Run PowerShell as Administrator!" }

New-Item -ItemType Directory -Path $PROGRESS -Force | Out-Null

# =============================================================================
# PRE-CHECK -- Detect what is already installed
# =============================================================================
Write-Host ""
Write-Host "=== MASTER HUB -- PRE-INSTALLATION CHECK ===" -ForegroundColor Magenta
Write-Host ""

# Find Git
$gitCmd = $null
foreach ($p in @("git", "C:\Program Files\Git\cmd\git.exe", "C:\Users\$env:USERNAME\AppData\Local\Programs\Git\cmd\git.exe")) {
    try { $v = & $p --version 2>&1; if ($LASTEXITCODE -eq 0) { $gitCmd = $p; break } } catch {}
}
if ($gitCmd) {
    $gitVer = & $gitCmd --version 2>&1
    Write-Ok "Git            : $gitVer"
    Mark-Done "git"
} else {
    Write-Warn "Git            : NOT FOUND -- will install"
}

# Find Docker
$dockerFound = $false
try { $v = & docker --version 2>&1; if ($LASTEXITCODE -eq 0) { $dockerFound = $true } } catch {}
if ($dockerFound) {
    $dv = & docker --version 2>&1
    $cv = & docker compose version 2>&1
    Write-Ok "Docker         : $dv"
    Write-Ok "Docker Compose : $cv"
    Mark-Done "docker"
} else {
    Write-Warn "Docker         : NOT FOUND -- will install"
}

# Find WSL
$wslFound = $false
try { $v = & wsl --status 2>&1; if ($v -notmatch "not installed") { $wslFound = $true } } catch {}
$wslFeature = (Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -ErrorAction SilentlyContinue).State
if ($wslFeature -eq "Enabled") {
    Write-Ok "WSL            : Enabled"
    Mark-Done "wsl_features"
} else {
    Write-Warn "WSL            : NOT enabled -- will enable (requires reboot)"
}

$wslKernel = $false
try { $v = & wsl --list --verbose 2>&1; if ($LASTEXITCODE -eq 0) { $wslKernel = $true } } catch {}
if ($wslKernel) {
    Write-Ok "WSL2 Kernel    : Installed"
    Mark-Done "wsl_kernel"
} else {
    Write-Warn "WSL2 Kernel    : NOT installed -- will install"
}

# Find IIS
$iisInstalled = (Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue).Installed
if ($iisInstalled) {
    Write-Ok "IIS            : Installed"
} else {
    Write-Warn "IIS            : NOT installed -- will install"
}

# Find URL Rewrite
$rewriteDll = "$env:SystemRoot\system32\inetsrv\rewrite.dll"
if (Test-Path $rewriteDll) {
    Write-Ok "URL Rewrite    : Installed"
} else {
    Write-Warn "URL Rewrite    : NOT found -- will install"
}

# Find ARR
$arrPath = "$env:ProgramFiles\IIS\Application Request Routing"
if (Test-Path $arrPath) {
    Write-Ok "IIS ARR        : Installed"
} else {
    Write-Warn "IIS ARR        : NOT found -- will install"
}

# IIS installed together so mark as done only if all three present
if ($iisInstalled -and (Test-Path $rewriteDll) -and (Test-Path $arrPath)) {
    Mark-Done "iis"
}

# Find Repo clone
if (Test-Path "$DEPLOY_PATH\.git") {
    Write-Ok "Repo           : Already cloned at $DEPLOY_PATH"
    Mark-Done "clone"
} else {
    Write-Warn "Repo           : NOT cloned -- will clone to $DEPLOY_PATH"
}

# Find containers running
$containersUp = $false
try {
    $ps = & docker ps --format "{{.Names}}" 2>&1
    if ($ps -match "master_hub") { $containersUp = $true }
} catch {}
if ($containersUp) {
    Write-Ok "Containers     : Running"
    Mark-Done "containers"
} else {
    Write-Warn "Containers     : NOT running -- will start"
}

# Find IIS site
$iisWebAdmin = Import-Module WebAdministration -PassThru -ErrorAction SilentlyContinue
$masterSite = Get-Website -Name "MasterHub" -ErrorAction SilentlyContinue
if ($masterSite) {
    Write-Ok "IIS Site       : MasterHub exists"
    Mark-Done "iis_site"
} else {
    Write-Warn "IIS Site       : NOT created -- will create"
}

# Find webhook service
$svc = Get-Service -Name "MasterHubWebhook" -ErrorAction SilentlyContinue
if ($svc) {
    Write-Ok "Webhook Svc    : Installed (Status: $($svc.Status))"
    Mark-Done "webhook_service"
} else {
    Write-Warn "Webhook Svc    : NOT installed -- will install"
}

Write-Host ""
Write-Host "--- Pre-check complete ---" -ForegroundColor Magenta
Write-Host ""
$confirm = Read-Host "Proceed with installing missing components? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Aborted. Nothing was changed." -ForegroundColor Yellow
    exit 0
}

# =============================================================================
# STEP 1 -- Install Git (only if not found)
# =============================================================================
Write-Step "STEP 1/8 - Git"
if (Is-Done "git") { Write-Skip "Git" } else {
    $gitExe = "$env:TEMP\git_setup.exe"
    Write-Info "Downloading Git..."
    Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.1/Git-2.47.0-64-bit.exe" -OutFile $gitExe -UseBasicParsing
    Start-Process -FilePath $gitExe -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP-" -Wait
    Remove-Item $gitExe -Force -ErrorAction SilentlyContinue
    $env:PATH = $env:PATH + ";C:\Program Files\Git\cmd"
    Write-Ok "Git installed."
    Mark-Done "git"
}

# Ensure git is in PATH for this session
$gitCmd = $null
foreach ($p in @("git", "C:\Program Files\Git\cmd\git.exe", "C:\Users\$env:USERNAME\AppData\Local\Programs\Git\cmd\git.exe")) {
    try { $null = & $p --version 2>&1; if ($LASTEXITCODE -eq 0) { $gitCmd = $p; break } } catch {}
}
if (-not $gitCmd) { Write-Fail "git not found in PATH after install." }

# =============================================================================
# STEP 2 -- Enable WSL2 Windows Features (requires reboot if not enabled)
# =============================================================================
Write-Step "STEP 2/8 - WSL2 Windows Features"
if (Is-Done "wsl_features") { Write-Skip "WSL2 features" } else {
    Enable-WindowsOptionalFeature -Online -FeatureName containers -All -NoRestart | Out-Null
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    Mark-Done "wsl_features"
    Write-Warn "REBOOT REQUIRED. Run this script again after reboot."
    Read-Host "Press Enter to reboot..."
    Restart-Computer -Force
    exit
}

# =============================================================================
# STEP 3 -- WSL2 Kernel + Ubuntu
# =============================================================================
Write-Step "STEP 3/8 - WSL2 Kernel and Ubuntu"
if (Is-Done "wsl_kernel") { Write-Skip "WSL2 kernel" } else {
    $wslMsi = "$env:TEMP\wsl_update.msi"
    Write-Info "Downloading WSL2 kernel update..."
    Invoke-WebRequest -Uri "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi" -OutFile $wslMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$wslMsi`" /quiet /norestart" -Wait
    Remove-Item $wslMsi -Force -ErrorAction SilentlyContinue
    wsl --set-default-version 2
    Write-Info "Installing Ubuntu..."
    wsl --install -d Ubuntu --no-launch
    Write-Ok "WSL2 and Ubuntu ready."
    Mark-Done "wsl_kernel"
}

# =============================================================================
# STEP 4 -- Docker Engine + Docker Compose
# =============================================================================
Write-Step "STEP 4/8 - Docker Engine and Docker Compose"
if (Is-Done "docker") { Write-Skip "Docker" } else {
    Write-Info "Installing DockerMsftProvider..."
    Install-Module -Name DockerMsftProvider -Repository PSGallery -Force -SkipPublisherCheck
    Write-Info "Installing Docker Engine (3-5 minutes)..."
    Install-Package -Name docker -ProviderName DockerMsftProvider -Force -RequiredVersion 20.10.9
    Start-Service docker
    Set-Service -Name docker -StartupType Automatic
    $count = 0
    while ($count -lt 20) {
        $null = & docker info 2>&1
        if ($LASTEXITCODE -eq 0) { break }
        $count++ ; Write-Info "Waiting for Docker... ($count/20)" ; Start-Sleep -Seconds 5
    }
    Write-Info "Installing Docker Compose v2..."
    $composePath = "C:\Program Files\Docker\cli-plugins"
    New-Item -ItemType Directory -Path $composePath -Force | Out-Null
    Invoke-WebRequest -Uri "https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-windows-x86_64.exe" -OutFile "$composePath\docker-compose.exe" -UseBasicParsing
    Write-Ok "Docker Engine and Compose installed."
    Mark-Done "docker"
}

# =============================================================================
# STEP 5 -- IIS + URL Rewrite + ARR
# =============================================================================
Write-Step "STEP 5/8 - IIS + URL Rewrite + ARR"
if (Is-Done "iis") { Write-Skip "IIS modules" } else {
    if (-not $iisInstalled) {
        Write-Info "Installing IIS..."
        Install-WindowsFeature -Name Web-Server, Web-Mgmt-Tools, Web-Http-Redirect -IncludeManagementTools | Out-Null
        Write-Ok "IIS installed."
    } else { Write-Skip "IIS" }

    if (-not (Test-Path $rewriteDll)) {
        Write-Info "Installing URL Rewrite..."
        $rwMsi = "$env:TEMP\rewrite.msi"
        Invoke-WebRequest -Uri "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi" -OutFile $rwMsi -UseBasicParsing
        Start-Process msiexec.exe -ArgumentList "/i `"$rwMsi`" /quiet /norestart" -Wait
        Remove-Item $rwMsi -Force -ErrorAction SilentlyContinue
        Write-Ok "URL Rewrite installed."
    } else { Write-Skip "URL Rewrite" }

    if (-not (Test-Path $arrPath)) {
        Write-Info "Installing ARR..."
        $arrMsi = "$env:TEMP\arr.msi"
        Invoke-WebRequest -Uri "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi" -OutFile $arrMsi -UseBasicParsing
        Start-Process msiexec.exe -ArgumentList "/i `"$arrMsi`" /quiet /norestart" -Wait
        Remove-Item $arrMsi -Force -ErrorAction SilentlyContinue
        Write-Ok "ARR installed."
    } else { Write-Skip "ARR" }

    $appCmd = "$env:SystemRoot\system32\inetsrv\appcmd.exe"
    if (Test-Path $appCmd) {
        & $appCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost 2>&1 | Out-Null
        Write-Ok "ARR proxy enabled."
    }
    Mark-Done "iis"
}

# =============================================================================
# STEP 6 -- Clone Repository
# =============================================================================
Write-Step "STEP 6/8 - Clone Repository"
if (Is-Done "clone") { Write-Skip "Repo clone" } else {
    Write-Info "Cloning repo to $DEPLOY_PATH ..."
    & $gitCmd clone $REPO_URL $DEPLOY_PATH
    if ($LASTEXITCODE -ne 0) { Write-Fail "git clone failed. Check network." }
    Write-Ok "Repository cloned."
    Mark-Done "clone"
}

# =============================================================================
# STEP 7 -- Configure .env + Start Containers
# =============================================================================
Write-Step "STEP 7/8 - Configure .env and Start Containers"
if (Is-Done "containers") { Write-Skip "Containers" } else {
    $envPath = "$DEPLOY_PATH\Backend-laravel\.env"
    if (-not (Test-Path $envPath)) {
        Copy-Item "$DEPLOY_PATH\Backend-laravel\.env.example" $envPath
        $c = Get-Content $envPath
        $c = $c -replace "DB_CONNECTION=.*",  "DB_CONNECTION=mysql"
        $c = $c -replace "# DB_HOST=.*",      "DB_HOST=db"
        $c = $c -replace "# DB_PORT=.*",      "DB_PORT=3306"
        $c = $c -replace "# DB_DATABASE=.*",  "DB_DATABASE=Master_Hub"
        $c = $c -replace "# DB_USERNAME=.*",  "DB_USERNAME=root"
        $c = $c -replace "# DB_PASSWORD=.*",  "DB_PASSWORD=root"
        $c | Set-Content $envPath
        Write-Ok ".env created and configured."
    } else { Write-Skip ".env" }

    Write-Info "Starting Docker containers (first run: 5-10 minutes)..."
    Set-Location $DEPLOY_PATH
    & docker compose up --build -d
    if ($LASTEXITCODE -ne 0) { Write-Warn "Check logs: docker compose logs" } else { Write-Ok "All 4 containers started." }
    Mark-Done "containers"
}

Write-Info "Running containers:"
& docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# =============================================================================
# STEP 8 -- IIS Site + SSL + Webhook Service
# =============================================================================
Write-Step "STEP 8/8 - IIS Site + SSL + Webhook Service"

if (Is-Done "iis_site") { Write-Skip "IIS site" } else {
    Write-Info "Creating self-signed SSL certificate..."
    $cert = New-SelfSignedCertificate -DnsName "master-hub-server","localhost" -CertStoreLocation "cert:\LocalMachine\My" -FriendlyName "MasterHub SSL" -NotAfter (Get-Date).AddYears(5)
    $thumb = $cert.Thumbprint
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
    if (-not (Get-Website -Name "MasterHub" -ErrorAction SilentlyContinue)) {
        New-Website -Name "MasterHub" -PhysicalPath $DEPLOY_PATH -Port 443 -Ssl | Out-Null
        $b = Get-WebBinding -Name "MasterHub" -Protocol "https"
        if ($b) { $b.AddSslCertificate($thumb, "My") }
        New-WebBinding -Name "MasterHub" -Protocol "http" -Port 80
        Start-Website -Name "MasterHub"
        Write-Ok "IIS site MasterHub created (ports 80 and 443)."
    } else { Write-Skip "IIS site MasterHub" }
    Mark-Done "iis_site"
}

if (Is-Done "webhook_service") { Write-Skip "Webhook service" } else {
    $svcScript = "$DEPLOY_PATH\deploy\install_service.ps1"
    if (Test-Path $svcScript) {
        & powershell.exe -ExecutionPolicy Bypass -File $svcScript
        Mark-Done "webhook_service"
    } else { Write-Warn "install_service.ps1 not found in repo." }
}

# =============================================================================
# DONE
# =============================================================================
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." -and $_.IPAddress -notmatch "^169\." } | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host "Frontend   : https://$ip/" -ForegroundColor White
Write-Host "API        : https://$ip/api/" -ForegroundColor White
Write-Host "phpMyAdmin : https://$ip/phpmyadmin/" -ForegroundColor White
Write-Host ""
Write-Host "TODO (3 manual steps):" -ForegroundColor Yellow
Write-Host "1. Set WEBHOOK_SECRET in: $DEPLOY_PATH\deploy\webhook_receiver.ps1" -ForegroundColor White
Write-Host "2. Run: Restart-Service MasterHubWebhook" -ForegroundColor White
Write-Host "3. Add GitHub Webhook -> http://${ip}:9000/deploy/" -ForegroundColor White
