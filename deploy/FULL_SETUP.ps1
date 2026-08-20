# Master Hub - Full Server Setup
# Save this file as FULL_SETUP.ps1 and run as Administrator

$REPO_URL    = "https://github.com/Mo-Mn3em/Master_Hub.git"
$DEPLOY_PATH = "C:\inetpub\master_hub"
$PROGRESS    = "C:\inetpub\.setup_progress"

function Write-Step { param([string]$T) Write-Host "" ; Write-Host "=== $T ===" -ForegroundColor Cyan }
function Write-Ok   { param([string]$T) Write-Host "[OK]   $T" -ForegroundColor Green }
function Write-Warn { param([string]$T) Write-Host "[WARN] $T" -ForegroundColor Yellow }
function Write-Fail { param([string]$T) Write-Host "[FAIL] $T" -ForegroundColor Red ; exit 1 }
function Write-Info { param([string]$T) Write-Host "[INFO] $T" -ForegroundColor White }
function Is-Done    { param([string]$S) return (Test-Path "$PROGRESS\$S") }
function Mark-Done  { param([string]$S) New-Item -ItemType File -Path "$PROGRESS\$S" -Force | Out-Null }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Fail "Run PowerShell as Administrator!" }

New-Item -ItemType Directory -Path $PROGRESS -Force | Out-Null
Write-Host "=== MASTER HUB FULL SERVER SETUP ===" -ForegroundColor Magenta

# STEP 1 - Install Git
Write-Step "STEP 1/8 - Install Git"
if (Is-Done "git") { Write-Ok "Already done." } else {
    $gitExe = "$env:TEMP\git_setup.exe"
    Write-Info "Downloading Git..."
    Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.1/Git-2.47.0-64-bit.exe" -OutFile $gitExe -UseBasicParsing
    Start-Process -FilePath $gitExe -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP-" -Wait
    Remove-Item $gitExe -Force -ErrorAction SilentlyContinue
    $env:PATH = $env:PATH + ";C:\Program Files\Git\cmd"
    Write-Ok "Git installed."
    Mark-Done "git"
}
if ($env:PATH -notlike "*Git\cmd*") { $env:PATH = $env:PATH + ";C:\Program Files\Git\cmd" }

# STEP 2 - Enable Windows Features (needs reboot)
Write-Step "STEP 2/8 - Enable WSL2 and Containers features"
if (Is-Done "wsl_features") { Write-Ok "Already done." } else {
    Enable-WindowsOptionalFeature -Online -FeatureName containers -All -NoRestart | Out-Null
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    Mark-Done "wsl_features"
    Write-Warn "A REBOOT IS REQUIRED. After reboot, run this script again."
    Read-Host "Press Enter to reboot now..."
    Restart-Computer -Force
    exit
}

# STEP 3 - WSL2 Kernel + Ubuntu
Write-Step "STEP 3/8 - Install WSL2 Kernel and Ubuntu"
if (Is-Done "wsl_kernel") { Write-Ok "Already done." } else {
    $wslMsi = "$env:TEMP\wsl_update.msi"
    Write-Info "Downloading WSL2 kernel update..."
    Invoke-WebRequest -Uri "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi" -OutFile $wslMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$wslMsi`" /quiet /norestart" -Wait
    Remove-Item $wslMsi -Force -ErrorAction SilentlyContinue
    wsl --set-default-version 2
    Write-Info "Installing Ubuntu..."
    wsl --install -d Ubuntu --no-launch
    Write-Ok "WSL2 and Ubuntu installed."
    Mark-Done "wsl_kernel"
}

# STEP 4 - Docker Engine + Compose
Write-Step "STEP 4/8 - Install Docker Engine and Docker Compose"
if (Is-Done "docker") { Write-Ok "Already done." } else {
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
        $count++
        Write-Info "Waiting for Docker... ($count/20)"
        Start-Sleep -Seconds 5
    }
    Write-Ok "Docker Engine running."
    Write-Info "Installing Docker Compose v2..."
    $composePath = "C:\Program Files\Docker\cli-plugins"
    New-Item -ItemType Directory -Path $composePath -Force | Out-Null
    Invoke-WebRequest -Uri "https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-windows-x86_64.exe" -OutFile "$composePath\docker-compose.exe" -UseBasicParsing
    Write-Ok "Docker Compose installed."
    Mark-Done "docker"
}

# STEP 5 - IIS + URL Rewrite + ARR
Write-Step "STEP 5/8 - Install IIS + URL Rewrite + ARR"
if (Is-Done "iis") { Write-Ok "Already done." } else {
    Write-Info "Installing IIS..."
    Install-WindowsFeature -Name Web-Server, Web-Mgmt-Tools, Web-Http-Redirect -IncludeManagementTools | Out-Null
    Write-Info "Installing URL Rewrite..."
    $rwMsi = "$env:TEMP\rewrite.msi"
    Invoke-WebRequest -Uri "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi" -OutFile $rwMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$rwMsi`" /quiet /norestart" -Wait
    Remove-Item $rwMsi -Force -ErrorAction SilentlyContinue
    Write-Ok "URL Rewrite installed."
    Write-Info "Installing ARR..."
    $arrMsi = "$env:TEMP\arr.msi"
    Invoke-WebRequest -Uri "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi" -OutFile $arrMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$arrMsi`" /quiet /norestart" -Wait
    Remove-Item $arrMsi -Force -ErrorAction SilentlyContinue
    Write-Ok "ARR installed."
    $appCmd = "$env:SystemRoot\system32\inetsrv\appcmd.exe"
    if (Test-Path $appCmd) {
        & $appCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost 2>&1 | Out-Null
        Write-Ok "ARR proxy enabled."
    }
    Mark-Done "iis"
}

# STEP 6 - Clone Repo
Write-Step "STEP 6/8 - Clone Repository"
if (Is-Done "clone") { Write-Ok "Already done." } else {
    if (-not (Test-Path "$DEPLOY_PATH\.git")) {
        Write-Info "Cloning repo to $DEPLOY_PATH ..."
        & "C:\Program Files\Git\cmd\git.exe" clone $REPO_URL $DEPLOY_PATH
        if ($LASTEXITCODE -ne 0) { Write-Fail "git clone failed. Check network." }
    }
    Write-Ok "Repository cloned."
    Mark-Done "clone"
}

# STEP 7 - .env + Docker Compose Up
Write-Step "STEP 7/8 - Configure .env and Start Containers"
if (Is-Done "containers") { Write-Ok "Already done." } else {
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
        Write-Ok ".env configured."
    }
    Write-Info "Starting Docker containers (first run: 5-10 min)..."
    Set-Location $DEPLOY_PATH
    & docker compose up --build -d
    if ($LASTEXITCODE -ne 0) { Write-Warn "Check logs: docker compose logs" } else { Write-Ok "Containers started." }
    Mark-Done "containers"
}

Write-Info "Running containers:"
& docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# STEP 8 - IIS Site + SSL + Webhook Service
Write-Step "STEP 8/8 - Create IIS Site and Webhook Service"
if (Is-Done "iis_site") { Write-Ok "Already done." } else {
    Write-Info "Creating self-signed SSL certificate..."
    $cert = New-SelfSignedCertificate -DnsName "master-hub-server","localhost" -CertStoreLocation "cert:\LocalMachine\My" -FriendlyName "MasterHub SSL" -NotAfter (Get-Date).AddYears(5)
    $thumb = $cert.Thumbprint
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
    $siteName = "MasterHub"
    if (-not (Get-Website -Name $siteName -ErrorAction SilentlyContinue)) {
        New-Website -Name $siteName -PhysicalPath $DEPLOY_PATH -Port 443 -Ssl | Out-Null
        $b = Get-WebBinding -Name $siteName -Protocol "https"
        if ($b) { $b.AddSslCertificate($thumb, "My") }
        New-WebBinding -Name $siteName -Protocol "http" -Port 80
        Start-Website -Name $siteName
        Write-Ok "IIS site MasterHub created (ports 80 and 443)."
    } else { Write-Ok "IIS site already exists." }
    Mark-Done "iis_site"
}

if (-not (Is-Done "webhook_service")) {
    $svcScript = "$DEPLOY_PATH\deploy\install_service.ps1"
    if (Test-Path $svcScript) {
        & powershell.exe -ExecutionPolicy Bypass -File $svcScript
        Mark-Done "webhook_service"
    }
}

# Summary
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." -and $_.IPAddress -notmatch "^169\." } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host "Frontend   : https://$ip/" -ForegroundColor White
Write-Host "API        : https://$ip/api/" -ForegroundColor White
Write-Host "phpMyAdmin : https://$ip/phpmyadmin/" -ForegroundColor White
Write-Host ""
Write-Host "TODO (manual):" -ForegroundColor Yellow
Write-Host "1. Set WEBHOOK_SECRET in $DEPLOY_PATH\deploy\webhook_receiver.ps1" -ForegroundColor White
Write-Host "2. Run: Restart-Service MasterHubWebhook" -ForegroundColor White
Write-Host "3. Add GitHub Webhook -> http://${ip}:9000/deploy/" -ForegroundColor White
Write-Host "4. In browser: click Advanced -> Proceed (SSL warning)" -ForegroundColor White
