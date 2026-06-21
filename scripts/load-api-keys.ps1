#!/usr/bin/env pwsh

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$target = Join-Path $PSScriptRoot "setup\load-api-keys.ps1"
if (-not (Test-Path $target)) {
	throw "Missing target script: $target"
}

& $target @args
exit $LASTEXITCODE


