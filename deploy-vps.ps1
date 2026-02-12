# VPS Deployment Script for Woodworking App
# Deploys to aifact3.com/woodworking-app
# Usage: .\deploy-vps.ps1

$VPS_HOST = "5.255.118.147"
$VPS_USER = "root"
$REMOTE_DIR = "/opt/woodworking-app"

Write-Host "Deploying Woodworking App to VPS..." -ForegroundColor Cyan
Write-Host "   Host: $VPS_HOST" -ForegroundColor White

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow

# Create temp directory for deployment files
$tempDir = Join-Path $PSScriptRoot "deploy-temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy necessary files
Copy-Item (Join-Path $PSScriptRoot "docker-compose.vps.yml") (Join-Path $tempDir "docker-compose.yml")
Copy-Item (Join-Path $PSScriptRoot "Dockerfile.frontend") $tempDir
Copy-Item (Join-Path $PSScriptRoot "nginx.conf") $tempDir
Copy-Item (Join-Path $PSScriptRoot "package.json") $tempDir
Copy-Item (Join-Path $PSScriptRoot "package-lock.json") $tempDir -ErrorAction SilentlyContinue
Copy-Item (Join-Path $PSScriptRoot "vite.config.js") $tempDir
Copy-Item (Join-Path $PSScriptRoot "index.html") $tempDir
Copy-Item -Recurse (Join-Path $PSScriptRoot "src") $tempDir
Copy-Item -Recurse (Join-Path $PSScriptRoot "backend") $tempDir
Copy-Item (Join-Path $PSScriptRoot "Caddyfile.woodworking") $tempDir -ErrorAction SilentlyContinue

# Remove unnecessary files from backend
Remove-Item (Join-Path $tempDir "backend\node_modules") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $tempDir "backend\database.sqlite") -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $tempDir "backend\__tests__") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Package created" -ForegroundColor Green

# Create remote directory first
Write-Host "Creating remote directory..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${REMOTE_DIR}"

# Upload to VPS using SCP
Write-Host "Uploading to VPS..." -ForegroundColor Yellow
$scpSource = "${tempDir}\*"
$scpDest = "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"
scp -r $scpSource $scpDest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed" -ForegroundColor Red
    Remove-Item $tempDir -Recurse -Force
    exit 1
}

Write-Host "Files uploaded" -ForegroundColor Green

# Execute remote deployment commands
Write-Host "Building and starting containers on VPS..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_HOST}" "cd ${REMOTE_DIR}; docker-compose down; docker-compose build --no-cache; docker-compose up -d; docker-compose ps"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote deployment failed" -ForegroundColor Red
    Remove-Item $tempDir -Recurse -Force
    exit 1
}

# Cleanup
Remove-Item $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Access the application at: https://aifact3.com/woodworking-app/" -ForegroundColor Cyan
