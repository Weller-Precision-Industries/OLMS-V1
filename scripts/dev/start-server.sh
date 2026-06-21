#!/usr/bin/env bash
set -euo pipefail

port="${PORT:-8080}"
key_path=""
mock="false"

while [[ $# -gt 0 ]]; do
	case "$1" in
		--port)
			port="$2"
			shift 2
			;;
		--keys)
			key_path="$2"
			shift 2
			;;
		--mock)
			mock="true"
			shift
			;;
		*)
			echo "Unknown argument: $1" >&2
			exit 1
			;;
	esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ "$mock" == "true" ]]; then
	export OLMS_MOCK_AI=true
else
	if [[ -n "$key_path" ]]; then
		source "$repo_root/scripts/setup/load-api-keys.sh" "$key_path" --quiet
	else
		source "$repo_root/scripts/setup/load-api-keys.sh" --quiet
	fi
fi

export PORT="$port"
npm run standalone
