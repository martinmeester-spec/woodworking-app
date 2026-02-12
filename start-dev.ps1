# Woodworking App Development Startup Script
# This script starts both the backend (port 3001) and frontend (port 3000) services

Write-Host "🚀 Starting Woodworking Cabinet System..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists in root
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
        exit 1
    }
}

# Check if node_modules exists in backend
if (-not (Test-Path ".\backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend dependency installation failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Dependencies ready" -ForegroundColor Green
Write-Host ""

# Setup backend environment file
if (-not (Test-Path ".\backend\.env")) {
    Write-Host "📝 Creating backend .env file from template..." -ForegroundColor Yellow
    if (Test-Path ".\backend\.env.example") {
        Copy-Item ".\backend\.env.example" ".\backend\.env"
        Write-Host "✅ Backend .env file created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Creating default .env file..." -ForegroundColor Yellow
        @"
PORT=3001
NODE_ENV=development
JWT_SECRET=woodworking-dev-secret-key-change-in-production
JWT_EXPIRY=24h
"@ | Out-File -FilePath ".\backend\.env" -Encoding utf8
        Write-Host "✅ Default .env file created" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "✅ Backend .env file exists" -ForegroundColor Green
    Write-Host ""
}

# Kill any existing processes on ports 3000 and 3001
Write-Host "🔍 Checking for existing processes on ports 3000 and 3001..." -ForegroundColor Yellow

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    $processId = $port3000.OwningProcess
    Write-Host "⚠️  Port 3000 is in use by process $processId. Stopping it..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($port3001) {
    $processId = $port3001.OwningProcess
    Write-Host "⚠️  Port 3001 is in use by process $processId. Stopping it..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "🔧 Starting Backend Server (Port 3001)..." -ForegroundColor Cyan

# Start backend in a new window
$backendJob = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Cyan; npm run dev" -PassThru

Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend is running on http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend health check failed, but continuing..." -ForegroundColor Yellow
    Write-Host "   Backend may still be initializing..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎨 Starting Frontend Server (Port 3000)..." -ForegroundColor Cyan

# Start frontend in a new window
$frontendJob = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🎨 Frontend Server Starting...' -ForegroundColor Cyan; npm run dev" -PassThru

Write-Host ""
Write-Host "✅ Both services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Information:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3001/api" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🌐 The frontend should open automatically in your browser" -ForegroundColor Yellow
Write-Host "   If not, navigate to: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏹️  To stop both services, close both PowerShell windows" -ForegroundColor Gray
Write-Host "   Or press Ctrl+C in each window" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Logs will appear in their respective windows" -ForegroundColor Gray
Write-Host ""

# Wait a moment and verify both are running
Start-Sleep -Seconds 3

Write-Host "🔍 Verifying services..." -ForegroundColor Yellow

# Check backend
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Backend: Running" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Backend: Starting (may take a few more seconds)" -ForegroundColor Yellow
}

# Check frontend (it may take longer to start)
Start-Sleep -Seconds 2
try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Frontend: Running" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Frontend: Starting (may take a few more seconds)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Startup complete! Check the service windows for detailed logs." -ForegroundColor Green
Write-Host ""
