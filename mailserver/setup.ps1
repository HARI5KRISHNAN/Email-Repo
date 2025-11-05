# Pilot180 Mail Server Setup Script (PowerShell)
# This script initializes the mail server configuration on Windows

$ErrorActionPreference = "Stop"

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Pilot180 Mail Server Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Function to print status messages
function Write-Success {
    param([string]$Message)
    Write-Host "[" -NoNewline
    Write-Host "✓" -ForegroundColor Green -NoNewline
    Write-Host "] $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[" -NoNewline
    Write-Host "!" -ForegroundColor Yellow -NoNewline
    Write-Host "] $Message"
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[" -NoNewline
    Write-Host "✗" -ForegroundColor Red -NoNewline
    Write-Host "] $Message"
}

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Cyan
try {
    docker ps | Out-Null
    Write-Success "Docker is running"
} catch {
    Write-ErrorMsg "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

# Check if in mailserver directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-ErrorMsg "Please run this script from the mailserver directory"
    exit 1
}

# Check if containers are running
Write-Host ""
Write-Host "Checking container status..." -ForegroundColor Cyan

$postfixRunning = docker ps | Select-String "pilot180-postfix"
if (-not $postfixRunning) {
    Write-Warning "Postfix container is not running. Starting mail server..."
    docker-compose up -d
    Start-Sleep -Seconds 5
}

$postfixRunning = docker ps | Select-String "pilot180-postfix"
if ($postfixRunning) {
    Write-Success "Postfix container is running"
} else {
    Write-ErrorMsg "Failed to start Postfix container"
    exit 1
}

$dovecotRunning = docker ps | Select-String "pilot180-dovecot"
if ($dovecotRunning) {
    Write-Success "Dovecot container is running"
} else {
    Write-Warning "Dovecot container is not running. Starting..."
    docker-compose up -d dovecot
    Start-Sleep -Seconds 3
}

# Initialize Postfix virtual mailboxes
Write-Host ""
Write-Host "Initializing Postfix virtual mailboxes..." -ForegroundColor Cyan
try {
    docker exec pilot180-postfix postmap /etc/postfix/vmailbox | Out-Null
    Write-Success "Virtual mailbox database created"
} catch {
    Write-ErrorMsg "Failed to create virtual mailbox database"
    exit 1
}

# Reload Postfix
docker exec pilot180-postfix postfix reload 2>&1 | Out-Null
Write-Success "Postfix configuration reloaded"

# Create mailbox directories
Write-Host ""
Write-Host "Creating mailbox directories..." -ForegroundColor Cyan
$createDirsCmd = @"
mkdir -p /var/mail/vhosts/pilot180.local/alice &&
mkdir -p /var/mail/vhosts/pilot180.local/bob &&
mkdir -p /var/mail/vhosts/pilot180.local/charlie &&
chown -R 1000:1000 /var/mail/vhosts &&
chmod -R 755 /var/mail/vhosts
"@

try {
    docker exec pilot180-postfix sh -c $createDirsCmd 2>&1 | Out-Null
    Write-Success "Mailbox directories created with correct permissions"
} catch {
    Write-ErrorMsg "Failed to create mailbox directories"
    exit 1
}

# Verify configuration
Write-Host ""
Write-Host "Verifying configuration..." -ForegroundColor Cyan

# Check virtual mailbox domains
$virtDomains = docker exec pilot180-postfix postconf -h virtual_mailbox_domains
if ($virtDomains -match "pilot180.local") {
    Write-Success "Virtual mailbox domains configured: $virtDomains"
} else {
    Write-Warning "Virtual mailbox domains not configured correctly"
}

# Check virtual mailbox maps
$virtMaps = docker exec pilot180-postfix postconf -h virtual_mailbox_maps
if ($virtMaps -match "lmdb:/etc/postfix/vmailbox") {
    Write-Success "Virtual mailbox maps configured: $virtMaps"
} else {
    Write-Warning "Virtual mailbox maps not configured correctly"
}

# Check mailbox directories
$mailboxDirs = docker exec pilot180-postfix sh -c "ls -1 /var/mail/vhosts/pilot180.local/ 2>/dev/null | wc -l"
if ([int]$mailboxDirs -ge 3) {
    Write-Success "Found $mailboxDirs mailbox directories"
} else {
    Write-Warning "Expected 3 mailbox directories, found $mailboxDirs"
}

# Test mail delivery
Write-Host ""
Write-Host "Testing mail delivery..." -ForegroundColor Cyan
$testEmailCmd = @"
echo 'Subject: Setup Test Email

This is an automated test email sent during setup.
If you see this, mail delivery is working correctly!' | sendmail bob@pilot180.local
"@

docker exec pilot180-postfix sh -c $testEmailCmd 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Check if email was delivered
$newMails = docker exec pilot180-dovecot sh -c "ls /var/mail/vhosts/pilot180.local/bob/new/ 2>/dev/null"
if ($newMails) {
    Write-Success "Test email delivered successfully"
} else {
    Write-Warning "Test email may not have been delivered (check logs)"
}

# Display summary
Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Mail Server Status:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}" | Select-String -Pattern "NAME|postfix|dovecot"

Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "  - Domain: pilot180.local"
Write-Host "  - Users: alice, bob, charlie"
Write-Host "  - SMTP Port: 25"
Write-Host "  - IMAP Port: 143"
Write-Host ""

Write-Host "Quick Test Commands:" -ForegroundColor Yellow
Write-Host "  View mail queue:  " -NoNewline
Write-Host "docker exec pilot180-postfix mailq" -ForegroundColor White
Write-Host "  Check mailbox:    " -NoNewline
Write-Host "docker exec pilot180-dovecot ls -la /var/mail/vhosts/pilot180.local/bob/new/" -ForegroundColor White
Write-Host "  Watch logs:       " -NoNewline
Write-Host "docker logs -f pilot180-postfix" -ForegroundColor White
Write-Host ""

Write-Host "Send test email:" -ForegroundColor Yellow
Write-Host "  docker exec pilot180-postfix sh -c `"echo 'Subject: Test' | sendmail bob@pilot180.local`"" -ForegroundColor White
Write-Host ""

Write-Success "Setup completed successfully!"
Write-Host ""
Write-Host "You can now test from the frontend at http://localhost:3006" -ForegroundColor Cyan
