#!/usr/bin/env pwsh

param(
	[int]$Port = 8080,
	[string]$KeyPath,
	[switch]$Mock
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

if ($Mock) {
	$env:OLMS_MOCK_AI = "true"
} else {
	$argsForLoader = @("-Quiet")
	if ($KeyPath) {
		$argsForLoader = @("-Path", $KeyPath, "-Quiet")
	}

	& (Join-Path $repoRoot "scripts\load-api-keys.ps1") @argsForLoader | Out-Null
}

$env:PORT = [string]$Port
npm run standalone
