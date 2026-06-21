#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Restart the OLMS standalone server for beta testing

.DESCRIPTION
    This script stops any running OLMS server on port 8080 and starts a fresh instance.
    Useful during development to ensure you're testing with the latest code changes.

.EXAMPLE
    .\restart-server.ps1
    
.EXAMPLE
    .\restart-server.ps1 -Port 8080
#>

param(
    [int]$Port = 8080,
    [switch]$NoWait = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Restarting OLMS Standalone Server..." -ForegroundColor Cyan
Write-Host ""

# Find and kill existing server process on the port
Write-Host "📋 Checking for existing server on port $Port..." -ForegroundColor Yellow

try {
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess | Select-Object -First 1
        if ($processId) {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "🛑 Stopping existing server (PID: $processId)..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 2
                Write-Host "✅ Server stopped" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "✅ No existing server found on port $Port" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not check for existing server: $_" -ForegroundColor Yellow
}

# Wait a moment for port to be released
if (-not $NoWait) {
    Start-Sleep -Seconds 1
}

# Start new server
Write-Host ""
Write-Host "🚀 Starting new server..." -ForegroundColor Cyan

$env:PORT = $Port
npm run standalone

