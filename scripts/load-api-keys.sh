#!/usr/bin/env bash
set -euo pipefail

target="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setup/load-api-keys.sh"
if [[ ! -f "$target" ]]; then
  echo "Missing target script: $target" >&2
  exit 1
fi

bash "$target" "$@"


