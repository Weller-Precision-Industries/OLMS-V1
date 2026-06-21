[CmdletBinding()]
param(
	[string]$Path,
	[switch]$Quiet
)

$ErrorActionPreference = 'Stop'

function Write-Info($message) {
	if (-not $Quiet) {
		Write-Host $message -ForegroundColor Cyan
	}
}

function Write-Warn($message) {
	Write-Host $message -ForegroundColor Yellow
}

try {
	$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
	if (-not $Path) {
		$Path = Join-Path $repoRoot 'secrets\api-keys.txt'
	}

	if (-not (Test-Path $Path)) {
		Write-Warn "No API key file found at '$Path'."
		Write-Host "Create it by copying secrets\api-keys.template.txt → secrets\api-keys.txt and filling in your keys." -ForegroundColor Gray
		exit 1
	}

	Write-Info "Loading API keys from $Path"

	$keyPairs = @{}
	$lineNumber = 0

	foreach ($line in Get-Content -Path $Path) {
		$lineNumber++
		$trimmed = $line.Trim()

		if (-not $trimmed -or $trimmed.StartsWith('#')) {
			continue
		}

		$parts = $trimmed -split '=', 2
		if ($parts.Count -ne 2) {
			Write-Warn "Skipping malformed line ${lineNumber}: $line"
			continue
		}

		$key = $parts[0].Trim()
		$value = $parts[1].Trim().Trim('"').Trim("'")

		if (-not $key) {
			Write-Warn "Skipping line $lineNumber because the key name is empty."
			continue
		}

		if (-not $value) {
			Write-Warn "Skipping $key because the value is empty."
			continue
		}

		$keyPairs[$key] = $value
	}

	if ($keyPairs.Count -eq 0) {
		Write-Warn "No valid KEY=VALUE entries were found in $Path."
		exit 1
	}

	$exported = @()

	foreach ($entry in $keyPairs.GetEnumerator()) {
		$key = $entry.Key
		$value = $entry.Value
		Set-Item -Path "Env:$key" -Value $value

		$masked = if ($value.Length -gt 6) { $value.Substring(0, 4) + '…' + $value.Substring($value.Length - 2) } else { '***' }
		Write-Info ("Set {0} = {1}" -f $key, $masked)
		$exported += [PSCustomObject]@{ Key = $key; MaskedValue = $masked }
	}

	if (-not $Quiet) {
		Write-Host ("Loaded {0} key(s)." -f $exported.Count) -ForegroundColor Green
	}

	return $exported
} catch {
	Write-Error $_.Exception.Message
	exit 1
}

