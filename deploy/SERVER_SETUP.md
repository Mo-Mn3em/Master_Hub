# Master Hub — Server Setup Guide

> **Complete step-by-step guide to deploy Master Hub on a Windows Server with IIS + Docker and auto-deploy from GitHub.**

---

## Prerequisites (Install these first on the server)

| Tool | Download |
|------|---------|
| Git for Windows | https://git-scm.com/download/win |
| Docker Desktop for Windows | https://www.docker.com/products/docker-desktop/ |
| IIS (Windows Feature) | Via Server Manager → Add Roles → Web Server (IIS) |
| IIS URL Rewrite 2.x | https://www.iis.net/downloads/microsoft/url-rewrite |
| IIS Application Request Routing (ARR) | https://www.iis.net/downloads/microsoft/application-request-routing |

---

## Step 1 — Run the Setup Script (One Time Only)

Open **PowerShell as Administrator** on the server and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
cd C:\path\to\this\repo\deploy
.\setup_server.ps1
```

This script will:
- ✅ Check Git, Docker, IIS modules
- ✅ Generate an SSH Deploy Key
- ✅ **Print the public key** (you'll add this to GitHub)
- ✅ Clone the private repo to `C:\inetpub\master_hub`
- ✅ Start all 4 Docker containers
- ✅ Install the webhook listener as a Windows Service

---

## Step 2 — Add Deploy Key to GitHub

1. Copy the public key printed by `setup_server.ps1`
2. Go to: **GitHub → your repo → Settings → Deploy Keys → Add Deploy Key**
3. Title: `MasterHub Server Deploy Key`
4. Paste the key
5. **Allow write access: NO** (read-only is safer)
6. Click **Add key**

---

## Step 3 — Enable ARR Proxy in IIS Manager

> ⚠️ This step is easy to forget — without it, reverse proxy rules don't work.

1. Open **IIS Manager**
2. Click the **server name** (top level, not a site)
3. Double-click **Application Request Routing Cache**
4. In the right panel click **Server Proxy Settings**
5. Check **Enable proxy**
6. Click **Apply**

---

## Step 4 — Create the IIS Site

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. Fill in:
   - **Site name**: `MasterHub`
   - **Physical path**: `C:\inetpub\master_hub`
   - **Binding type**: `https`
   - **Port**: `443`
   - **SSL certificate**: Select your certificate (or create a self-signed one — see below)
4. Click **OK**

### Creating a Self-Signed Certificate (if you don't have one)
1. In IIS Manager → Server level → **Server Certificates**
2. Right panel → **Create Self-Signed Certificate**
3. Friendly name: `MasterHub`
4. Select **Web Hosting** store
5. Click **OK** — it will now appear in the SSL cert dropdown

---

## Step 5 — Set the Webhook Secret

1. Open `C:\inetpub\master_hub\deploy\webhook_receiver.ps1`
2. Find this line near the top:
   ```powershell
   $WEBHOOK_SECRET = "REPLACE_WITH_YOUR_WEBHOOK_SECRET"
   ```
3. Replace `REPLACE_WITH_YOUR_WEBHOOK_SECRET` with any strong random string (e.g. generate one at https://www.uuidgenerator.net/)
4. Save the file
5. Restart the service:
   ```powershell
   Restart-Service MasterHubWebhook
   ```

---

## Step 6 — Add the GitHub Webhook

1. Go to: **GitHub → your repo → Settings → Webhooks → Add webhook**
2. Fill in:
   - **Payload URL**: `http://<YOUR_SERVER_IP>:9000/deploy/`
   - **Content type**: `application/json`
   - **Secret**: *(same value you set in `webhook_receiver.ps1`)*
   - **Which events?**: Just the `push` event
3. Click **Add webhook**
4. GitHub will send a test ping — check `deploy\logs\webhook.log` to confirm it was received

---

## Verification

### Check Docker containers are running
```powershell
docker ps
```
You should see 4 containers:
- `master_hub_frontend` → port 5173
- `master_hub_backend` → port 8000
- `master_hub_db` → port 3307
- `master_hub_phpmyadmin` → port 8080

### Check webhook service is running
```powershell
Get-Service MasterHubWebhook
```
Status should be `Running`.

### Test auto-deploy
1. Make any small change in your code (e.g. add a comment)
2. Commit and push to `main` on GitHub
3. Wait ~15–30 seconds
4. Check `C:\inetpub\master_hub\deploy\logs\deploy.log`
5. You should see `git pull` and `docker compose up` output
6. Refresh the site in your browser — change should be live ✅

### Browse the app
| URL | What you see |
|-----|-------------|
| `https://<server-ip>/` | React Frontend |
| `https://<server-ip>/api/` | Laravel API |
| `https://<server-ip>/phpmyadmin/` | phpMyAdmin GUI |

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| Webhook not triggering | `deploy\logs\webhook.log` — is the service running? Is port 9000 open in firewall? |
| `git pull` fails | SSH Deploy Key added to GitHub? Run `ssh -T git@github.com` to test |
| Docker containers not starting | `docker compose logs` in `C:\inetpub\master_hub` |
| IIS returning 502 Bad Gateway | Is ARR proxy enabled? Are Docker containers running? |
| Browser shows certificate warning | Expected for self-signed cert — click Advanced → Proceed |

---

## Log Files

| Log | What it contains |
|-----|-----------------|
| `deploy\logs\webhook.log` | All incoming webhook requests + validation results |
| `deploy\logs\deploy.log` | git pull + docker compose output per deploy |
| `deploy\logs\service_stdout.log` | NSSM service stdout |
| `deploy\logs\service_stderr.log` | NSSM service stderr |

---

## Service Management

```powershell
# Check status
Get-Service MasterHubWebhook

# Stop the service
Stop-Service MasterHubWebhook

# Start the service
Start-Service MasterHubWebhook

# Restart the service (after editing webhook_receiver.ps1)
Restart-Service MasterHubWebhook

# Remove the service completely
C:\tools\nssm\win64\nssm.exe remove MasterHubWebhook confirm
```
