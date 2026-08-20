# =============================================================================
#  Master Hub — FULL SERVER SETUP SCRIPT
#  Run this ONE script on a fresh Windows Server as Administrator.
#  It installs and configures EVERYTHING:
#    1. Git
#    2. WSL2 + Ubuntu
#    3. Docker Engine + Docker Compose
#    4. IIS + URL Rewrite + ARR modules
#    5. Clones the GitHub repo
#    6. Creates .env for Laravel
#    7. Starts all 4 Docker containers
#    8. Installs the Webhook Windows Service (auto-deploy on git push)
#
#  USAGE (on Windows Server, PowerShell as Administrator):
#    Set-ExecutionPolicy Bypass -Scope Process -Force
#    .\FULL_SETUP.ps1
#
#  NOTE: The script will reboot the server ONCE (after enabling WSL2).
#        After reboot, run it again — it will skip completed steps.
# =============================================================================

$REPO_URL    = "https://github.com/Mo-Mn3em/Master_Hub.git"
$DEPLOY_PATH = "C:\inetpub\master_hub"
$PROGRESS    = "C:\inetpub\.setup_progress"   # tracks which steps are done

# ── Colour helpers ─────────────────────────────────────────────────────────────
function Write-Step   { param([string]$T) Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkCyan; Write-Host "  $T" -ForegroundColor Cyan }
function Write-Ok     { param([string]$T) Write-Host "  ✔  $T" -ForegroundColor Green }
function Write-Warn   { param([string]$T) Write-Host "  ⚠  $T" -ForegroundColor Yellow }
function Write-Fail   { param([string]$T) Write-Host "  ✘  $T" -ForegroundColor Red; exit 1 }
function Write-Info   { param([string]$T) Write-Host "  ℹ  $T" -ForegroundColor White }

function Is-Done      { param([string]$step) return (Test-Path "$PROGRESS\$step") }
function Mark-Done    { param([string]$step) New-Item -ItemType File -Path "$PROGRESS\$step" -Force | Out-Null }

# ── Must run as Admin ──────────────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Fail "Run PowerShell as Administrator!" }

New-Item -ItemType Directory -Path $PROGRESS -Force | Out-Null

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║     MASTER HUB — FULL SERVER SETUP      ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# =============================================================================
# STEP 1 — Install Git
# =============================================================================
Write-Step "STEP 1/8 — Installing Git"

if (Is-Done "git") {
    Write-Ok "Git already installed. Skipping."
} else {
    $gitInstaller = "$env:TEMP\GitInstaller.exe"
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.1/Git-2.47.0-64-bit.exe"

    Write-Info "Downloading Git..."
    Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller -UseBasicParsing
    Write-Info "Installing Git silently..."
    Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS=icons,ext\reg\shellhere,assoc,assoc_sh" -Wait
    Remove-Item $gitInstaller -Force -ErrorAction SilentlyContinue

    # Add Git to PATH for this session
    $env:PATH = $env:PATH + ";C:\Program Files\Git\cmd"

    $gitVer = & "C:\Program Files\Git\cmd\git.exe" --version 2>&1
    Write-Ok "Git installed: $gitVer"
    Mark-Done "git"
}

# Ensure Git is in PATH for this session
if ($env:PATH -notlike "*Git\cmd*") {
    $env:PATH = $env:PATH + ";C:\Program Files\Git\cmd"
}

# =============================================================================
# STEP 2 — Enable WSL2 + Containers Windows Features
# =============================================================================
Write-Step "STEP 2/8 — Enabling WSL2 and Containers features"

if (Is-Done "wsl_features") {
    Write-Ok "WSL2 features already enabled. Skipping."
} else {
    Write-Info "Enabling Windows Containers feature..."
    Enable-WindowsOptionalFeature -Online -FeatureName containers -All -NoRestart | Out-Null

    Write-Info "Enabling WSL feature..."
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Out-Null

    Write-Info "Enabling Virtual Machine Platform..."
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Out-Null

    Mark-Done "wsl_features"

    Write-Warn "Features enabled. THE SERVER MUST REBOOT NOW."
    Write-Warn "After reboot, run this script again — it will continue from Step 3."
    Write-Host ""
    Read-Host "Press Enter to reboot now..."
    Restart-Computer -Force
    exit
}

# =============================================================================
# STEP 3 — Install WSL2 Kernel Update + Ubuntu
# =============================================================================
Write-Step "STEP 3/8 — Installing WSL2 Kernel + Ubuntu"

if (Is-Done "wsl_kernel") {
    Write-Ok "WSL2 kernel already installed. Skipping."
} else {
    Write-Info "Downloading WSL2 kernel update..."
    $wslMsi = "$env:TEMP\wsl_update_x64.msi"
    Invoke-WebRequest -Uri "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi" -OutFile $wslMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$wslMsi`" /quiet /norestart" -Wait
    Remove-Item $wslMsi -Force -ErrorAction SilentlyContinue
    Write-Ok "WSL2 kernel update installed."

    Write-Info "Setting WSL2 as default version..."
    wsl --set-default-version 2

    Write-Info "Installing Ubuntu (this takes 2-3 minutes)..."
    wsl --install -d Ubuntu --no-launch
    Write-Ok "Ubuntu installed."

    Mark-Done "wsl_kernel"
}

# =============================================================================
# STEP 4 — Install Docker Engine + Docker Compose
# =============================================================================
Write-Step "STEP 4/8 — Installing Docker Engine + Docker Compose"

if (Is-Done "docker") {
    Write-Ok "Docker already installed. Skipping."
} else {
    Write-Info "Installing DockerMsftProvider module..."
    Install-Module -Name DockerMsftProvider -Repository PSGallery -Force -SkipPublisherCheck

    Write-Info "Installing Docker Engine (this takes 3-5 minutes)..."
    Install-Package -Name docker -ProviderName DockerMsftProvider -Force -RequiredVersion 20.10.9

    Write-Info "Starting Docker service..."
    Start-Service docker
    Set-Service -Name docker -StartupType Automatic

    # Wait for Docker to be ready
    $maxTries = 30
    $count = 0
    while ($count -lt $maxTries) {
        $dockerReady = & docker info 2>&1
        if ($LASTEXITCODE -eq 0) { break }
        $count++
        Start-Sleep -Seconds 3
    }

    # Configure daemon.json for better settings
    $daemonConfig = '{"experimental":true,"features":{"buildkit":true}}'
    $daemonPath = "C:\ProgramData\Docker\config\daemon.json"
    New-Item -ItemType Directory -Path (Split-Path $daemonPath) -Force | Out-Null
    Set-Content -Path $daemonPath -Value $daemonConfig
    Restart-Service docker
    Start-Sleep -Seconds 5

    $dockerVer = & docker --version 2>&1
    Write-Ok "Docker Engine installed: $dockerVer"

    # Install Docker Compose v2
    Write-Info "Installing Docker Compose v2..."
    $composePath = "C:\Program Files\Docker\cli-plugins"
    New-Item -ItemType Directory -Path $composePath -Force | Out-Null
    Invoke-WebRequest `
        -Uri "https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-windows-x86_64.exe" `
        -OutFile "$composePath\docker-compose.exe" `
        -UseBasicParsing

    $composeVer = & docker compose version 2>&1
    Write-Ok "Docker Compose installed: $composeVer"

    Mark-Done "docker"
}

# =============================================================================
# STEP 5 — Install IIS + URL Rewrite + ARR
# =============================================================================
Write-Step "STEP 5/8 — Installing IIS + URL Rewrite + ARR"

if (Is-Done "iis") {
    Write-Ok "IIS already configured. Skipping."
} else {
    Write-Info "Installing IIS and required features..."
    Install-WindowsFeature -Name Web-Server, Web-Mgmt-Tools, Web-Url-Auth, Web-Http-Redirect `
        -IncludeManagementTools | Out-Null

    # Download and install URL Rewrite
    Write-Info "Downloading IIS URL Rewrite module..."
    $rewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
    $rewriteMsi = "$env:TEMP\rewrite_amd64.msi"
    Invoke-WebRequest -Uri $rewriteUrl -OutFile $rewriteMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$rewriteMsi`" /quiet /norestart" -Wait
    Remove-Item $rewriteMsi -Force -ErrorAction SilentlyContinue
    Write-Ok "URL Rewrite installed."

    # Download and install ARR
    Write-Info "Downloading IIS Application Request Routing (ARR)..."
    $arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
    $arrMsi = "$env:TEMP\arr_amd64.msi"
    Invoke-WebRequest -Uri $arrUrl -OutFile $arrMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$arrMsi`" /quiet /norestart" -Wait
    Remove-Item $arrMsi -Force -ErrorAction SilentlyContinue
    Write-Ok "ARR installed."

    # Enable ARR proxy via appcmd
    $appCmd = "$env:SystemRoot\system32\inetsrv\appcmd.exe"
    if (Test-Path $appCmd) {
        & $appCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost 2>&1 | Out-Null
        Write-Ok "ARR proxy enabled."
    } else {
        Write-Warn "appcmd not found. You will need to enable ARR proxy manually in IIS Manager."
    }

    Mark-Done "iis"
}

# =============================================================================
# STEP 6 — Clone the Repository
# =============================================================================
Write-Step "STEP 6/8 — Cloning Master Hub Repository"

if (Is-Done "clone") {
    Write-Ok "Repository already cloned. Skipping."
} else {
    if (Test-Path "$DEPLOY_PATH\.git") {
        Write-Ok "Repo already exists at $DEPLOY_PATH."
    } else {
        Write-Info "Cloning from $REPO_URL ..."
        & "C:\Program Files\Git\cmd\git.exe" clone $REPO_URL $DEPLOY_PATH
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "git clone failed. Check network and repo URL."
        }
        Write-Ok "Repository cloned to $DEPLOY_PATH"
    }
    Mark-Done "clone"
}

# =============================================================================
# STEP 7 — Setup .env + Start Docker Containers
# =============================================================================
Write-Step "STEP 7/8 — Configuring .env and Starting Docker Containers"

if (Is-Done "containers") {
    Write-Ok "Containers already started. Skipping initial build."
} else {
    # Create .env from example
    $envPath = "$DEPLOY_PATH\Backend-laravel\.env"
    $envExample = "$DEPLOY_PATH\Backend-laravel\.env.example"

    if (-not (Test-Path $envPath)) {
        Copy-Item $envExample $envPath
        # Force correct DB settings for Docker
        (Get-Content $envPath) `
            -replace "DB_CONNECTION=.*", "DB_CONNECTION=mysql" `
            -replace "#\s*DB_HOST=.*",   "DB_HOST=db" `
            -replace "#\s*DB_PORT=.*",   "DB_PORT=3306" `
            -replace "#\s*DB_DATABASE=.*","DB_DATABASE=Master_Hub" `
            -replace "#\s*DB_USERNAME=.*","DB_USERNAME=root" `
            -replace "#\s*DB_PASSWORD=.*","DB_PASSWORD=root" |
            Set-Content $envPath
        Write-Ok ".env created and configured."
    } else {
        Write-Ok ".env already exists."
    }

    # Build and start containers
    Write-Info "Building and starting all 4 Docker containers..."
    Write-Info "This will take 5-10 minutes on the first run (downloading images)..."
    Set-Location $DEPLOY_PATH
    & docker compose up --build -d
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "docker compose returned non-zero. Check: docker compose logs"
    } else {
        Write-Ok "All containers started."
    }

    Mark-Done "containers"
}

# Show running containers
Write-Info "Running containers:"
& docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# =============================================================================
# STEP 8 — Create IIS Site + Install Webhook Service
# =============================================================================
Write-Step "STEP 8/8 — Creating IIS Site and Installing Webhook Service"

if (Is-Done "iis_site") {
    Write-Ok "IIS site already created. Skipping."
} else {
    # Create a self-signed SSL certificate
    Write-Info "Creating self-signed SSL certificate..."
    $cert = New-SelfSignedCertificate `
        -DnsName "master-hub-server", "localhost" `
        -CertStoreLocation "cert:\LocalMachine\My" `
        -FriendlyName "MasterHub SSL" `
        -NotAfter (Get-Date).AddYears(5)
    $certThumb = $cert.Thumbprint
    Write-Ok "Certificate created. Thumbprint: $certThumb"

    # Import WebAdministration module
    Import-Module WebAdministration -ErrorAction SilentlyContinue

    # Remove default IIS site if it's using port 80/443
    $defaultSite = Get-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
    if ($defaultSite) {
        Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
        Write-Ok "Default Web Site stopped (to free port 80/443)."
    }

    # Create the MasterHub IIS site
    $siteName = "MasterHub"
    $existingSite = Get-Website -Name $siteName -ErrorAction SilentlyContinue
    if (-not $existingSite) {
        New-Website `
            -Name $siteName `
            -PhysicalPath $DEPLOY_PATH `
            -Port 443 `
            -Ssl | Out-Null

        # Add HTTPS binding with the self-signed cert
        $binding = Get-WebBinding -Name $siteName -Protocol "https"
        if ($binding) {
            $binding.AddSslCertificate($certThumb, "My")
        }

        # Also add HTTP binding (for redirect to HTTPS)
        New-WebBinding -Name $siteName -Protocol "http" -Port 80

        Start-Website -Name $siteName
        Write-Ok "IIS Site '$siteName' created on ports 80 (HTTP) and 443 (HTTPS)."
    } else {
        Write-Ok "IIS Site '$siteName' already exists."
    }

    Mark-Done "iis_site"
}

# Install webhook service
Write-Step "Installing GitHub Webhook Windows Service"
if (Is-Done "webhook_service") {
    Write-Ok "Webhook service already installed. Skipping."
} else {
    if (Test-Path "$DEPLOY_PATH\deploy\install_service.ps1") {
        & powershell.exe -ExecutionPolicy Bypass -File "$DEPLOY_PATH\deploy\install_service.ps1"
        Mark-Done "webhook_service"
    } else {
        Write-Warn "install_service.ps1 not found. Skipping webhook service."
    }
}

# =============================================================================
# DONE — Print Summary
# =============================================================================
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║         ✔  MASTER HUB SERVER SETUP COMPLETE!               ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Access your app from ANY device on the network:" -ForegroundColor Cyan
$serverIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "127\." -and $_.IPAddress -notmatch "169\." } | Select-Object -First 1).IPAddress
Write-Host "  🌐  Frontend  : https://$serverIP/" -ForegroundColor White
Write-Host "  🔌  API       : https://$serverIP/api/" -ForegroundColor White
Write-Host "  🗄️   phpMyAdmin: https://$serverIP/phpmyadmin/" -ForegroundColor White
Write-Host ""
Write-Host "  ⚠️  STILL TO DO (manual — takes 5 minutes):" -ForegroundColor Yellow
Write-Host "  1. Open webhook_receiver.ps1 and set your WEBHOOK_SECRET" -ForegroundColor White
Write-Host "     File: $DEPLOY_PATH\deploy\webhook_receiver.ps1" -ForegroundColor Gray
Write-Host "  2. Restart-Service MasterHubWebhook" -ForegroundColor White
Write-Host "  3. Add GitHub Webhook:" -ForegroundColor White
Write-Host "     → GitHub repo → Settings → Webhooks → Add webhook" -ForegroundColor Gray
Write-Host "     → Payload URL: http://${serverIP}:9000/deploy/" -ForegroundColor Gray
Write-Host "     → Secret: (same as WEBHOOK_SECRET)" -ForegroundColor Gray
Write-Host "  4. Accept SSL warning in browser (self-signed cert)" -ForegroundColor White
Write-Host "     → Click Advanced → Proceed to site" -ForegroundColor Gray
Write-Host ""
Write-Host "  📋  Useful commands:" -ForegroundColor Cyan
Write-Host "  docker ps                    — see running containers" -ForegroundColor Gray
Write-Host "  docker compose logs -f       — live container logs" -ForegroundColor Gray
Write-Host "  Get-Service MasterHubWebhook — check webhook service" -ForegroundColor Gray
Write-Host ""
