# =============================================================================
#  Master Hub — GitHub Webhook Receiver
#  Runs as a Windows Service (via NSSM). Listens on port 9000.
#  Validates GitHub HMAC-SHA256 signature, checks branch = main,
#  then calls deploy.ps1 to pull + rebuild Docker containers.
# =============================================================================

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
$WEBHOOK_SECRET  = "REPLACE_WITH_YOUR_WEBHOOK_SECRET"   # Must match GitHub Webhook secret
$LISTEN_PORT     = 9000
$TRIGGER_BRANCH  = "refs/heads/main"
$DEPLOY_SCRIPT   = "C:\inetpub\master_hub\deploy\deploy.ps1"
$LOG_FILE        = "C:\inetpub\master_hub\deploy\logs\webhook.log"
$REPO_PATH       = "C:\inetpub\master_hub"
# ─────────────────────────────────────────────────────────────────────────────

# Ensure log directory exists
$logDir = Split-Path $LOG_FILE -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp][$Level] $Message"
    Add-Content -Path $LOG_FILE -Value $entry
    Write-Host $entry
}

function Get-HmacSha256 {
    param([string]$Secret, [byte[]]$Body)
    $keyBytes  = [System.Text.Encoding]::UTF8.GetBytes($Secret)
    $hmac      = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key  = $keyBytes
    $hashBytes = $hmac.ComputeHash($Body)
    return "sha256=" + (($hashBytes | ForEach-Object { $_.ToString("x2") }) -join "")
}

function Compare-SecureString {
    param([string]$A, [string]$B)
    # Constant-time comparison to prevent timing attacks
    if ($A.Length -ne $B.Length) { return $false }
    $result = 0
    for ($i = 0; $i -lt $A.Length; $i++) {
        $result = $result -bor ([int][char]$A[$i] -bxor [int][char]$B[$i])
    }
    return $result -eq 0
}

# ── START LISTENER ─────────────────────────────────────────────────────────────
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$LISTEN_PORT/deploy/")

try {
    $listener.Start()
    Write-Log "Webhook receiver started on port $LISTEN_PORT — waiting for GitHub pushes..."
}
catch {
    Write-Log "FATAL: Could not start HTTP listener on port $LISTEN_PORT. Error: $_" "ERROR"
    Write-Log "Run this script as Administrator or check if the port is already in use." "ERROR"
    exit 1
}

# ── MAIN LOOP ──────────────────────────────────────────────────────────────────
while ($listener.IsListening) {
    try {
        $context  = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response

        Write-Log "Incoming request: $($request.HttpMethod) from $($request.RemoteEndPoint)"

        # ── Only accept POST ──────────────────────────────────────────────────
        if ($request.HttpMethod -ne "POST") {
            Write-Log "Rejected: Not a POST request." "WARN"
            $response.StatusCode = 405
            $response.Close()
            continue
        }

        # ── Read raw body bytes ───────────────────────────────────────────────
        $bodyStream = $request.InputStream
        $bodyBytes  = [System.IO.Stream]::Synchronized($bodyStream) | ForEach-Object {
            $ms = New-Object System.IO.MemoryStream
            $bodyStream.CopyTo($ms)
            $ms.ToArray()
        }
        $bodyText = [System.Text.Encoding]::UTF8.GetString($bodyBytes)

        # ── Validate HMAC-SHA256 signature ────────────────────────────────────
        $githubSig = $request.Headers["X-Hub-Signature-256"]
        if (-not $githubSig) {
            Write-Log "Rejected: Missing X-Hub-Signature-256 header." "WARN"
            $response.StatusCode = 401
            $response.Close()
            continue
        }

        $expectedSig = Get-HmacSha256 -Secret $WEBHOOK_SECRET -Body $bodyBytes
        if (-not (Compare-SecureString $githubSig $expectedSig)) {
            Write-Log "Rejected: Invalid HMAC signature. Possible unauthorized request." "WARN"
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        Write-Log "HMAC signature validated OK."

        # ── Check event type ──────────────────────────────────────────────────
        $githubEvent = $request.Headers["X-GitHub-Event"]
        if ($githubEvent -ne "push") {
            Write-Log "Skipped: Event is '$githubEvent', not a push event." "INFO"
            $response.StatusCode = 200
            $responseBody = [System.Text.Encoding]::UTF8.GetBytes("OK - Ignored non-push event")
            $response.OutputStream.Write($responseBody, 0, $responseBody.Length)
            $response.Close()
            continue
        }

        # ── Check branch ──────────────────────────────────────────────────────
        $payload = $bodyText | ConvertFrom-Json
        $ref     = $payload.ref

        if ($ref -ne $TRIGGER_BRANCH) {
            Write-Log "Skipped: Push was to '$ref', not '$TRIGGER_BRANCH'." "INFO"
            $response.StatusCode = 200
            $responseBody = [System.Text.Encoding]::UTF8.GetBytes("OK - Ignored branch: $ref")
            $response.OutputStream.Write($responseBody, 0, $responseBody.Length)
            $response.Close()
            continue
        }

        $pusher  = $payload.pusher.name
        $commits = $payload.commits.Count
        $head    = $payload.head_commit.id.Substring(0, 7)
        Write-Log "=== DEPLOY TRIGGERED === Branch: $ref | Pusher: $pusher | Commits: $commits | SHA: $head"

        # ── Send immediate 200 OK to GitHub (before deploy starts) ────────────
        $response.StatusCode = 200
        $responseBody = [System.Text.Encoding]::UTF8.GetBytes("OK - Deploy started")
        $response.OutputStream.Write($responseBody, 0, $responseBody.Length)
        $response.Close()

        # ── Run deploy script asynchronously ──────────────────────────────────
        $job = Start-Job -ScriptBlock {
            param($script, $logFile)
            & powershell.exe -NonInteractive -ExecutionPolicy Bypass -File $script 2>&1 |
                ForEach-Object { Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')][DEPLOY] $_" }
        } -ArgumentList $DEPLOY_SCRIPT, $LOG_FILE

        Write-Log "Deploy job started (Job ID: $($job.Id)). Check deploy.log for progress."

    }
    catch {
        Write-Log "Unhandled error in request loop: $_" "ERROR"
        try { $response.StatusCode = 500; $response.Close() } catch {}
    }
}
