# Docker Deployment Script for Woodworking App
# Usage: .\deploy.ps1

Write-Host "🚀 Starting Woodworking App Docker Deployment..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Build and start containers
Write-Host "`n📦 Building Docker containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check health
Write-Host "`n🔍 Checking service health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Frontend is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend health check failed (may still be starting)" -ForegroundColor Yellow
}

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📍 Access the application at:" -ForegroundColor Cyan
Write-Host "   http://localhost:4000/woodworking-app/" -ForegroundColor White
Write-Host "`n📊 View logs with:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "`n🛑 Stop with:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
