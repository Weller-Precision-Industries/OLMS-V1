#!/bin/bash
# Load API keys from secrets/api-keys.txt into environment variables
# Usage: source scripts/setup/load-api-keys.sh [path] [-q|--quiet]

set -euo pipefail

# Colors for output
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Default values
QUIET=false
KEY_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -q|--quiet)
            QUIET=true
            shift
            ;;
        *)
            if [[ -z "$KEY_FILE" ]]; then
                KEY_FILE="$1"
            fi
            shift
            ;;
    esac
done

# Get script directory and repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Set default path if not provided
if [[ -z "$KEY_FILE" ]]; then
    KEY_FILE="$REPO_ROOT/secrets/api-keys.txt"
fi

# Check if file exists
if [[ ! -f "$KEY_FILE" ]]; then
    echo -e "${YELLOW}No API key file found at '$KEY_FILE'.${NC}" >&2
    echo -e "${GRAY}Create it by copying secrets/api-keys.template.txt → secrets/api-keys.txt and filling in your keys.${NC}" >&2
    exit 1
fi

# Print info unless quiet
if [[ "$QUIET" == false ]]; then
    echo -e "${CYAN}Loading API keys from $KEY_FILE${NC}"
fi

# Associative array to store key-value pairs (bash 4+)
declare -A key_pairs
line_number=0
exported_count=0

# Read file line by line
while IFS= read -r line || [[ -n "$line" ]]; do
    line_number=$((line_number + 1))
    trimmed=$(echo "$line" | xargs)
    
    # Skip empty lines and comments
    if [[ -z "$trimmed" ]] || [[ "$trimmed" == \#* ]]; then
        continue
    fi
    
    # Split on = (first occurrence only)
    if [[ "$trimmed" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Trim key and value
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Remove surrounding quotes if present
        value=$(echo "$value" | sed -e "s/^[\"']//" -e "s/[\"']$//")
        
        # Validate key
        if [[ -z "$key" ]]; then
            if [[ "$QUIET" == false ]]; then
                echo -e "${YELLOW}Skipping line $line_number because the key name is empty.${NC}" >&2
            fi
            continue
        fi
        
        # Validate value
        if [[ -z "$value" ]]; then
            if [[ "$QUIET" == false ]]; then
                echo -e "${YELLOW}Skipping $key because the value is empty.${NC}" >&2
            fi
            continue
        fi
        
        key_pairs["$key"]="$value"
    else
        if [[ "$QUIET" == false ]]; then
            echo -e "${YELLOW}Skipping malformed line ${line_number}: $line${NC}" >&2
        fi
        continue
    fi
done < "$KEY_FILE"

# Check if we found any keys
if [[ ${#key_pairs[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No valid KEY=VALUE entries were found in $KEY_FILE.${NC}" >&2
    exit 1
fi

# Export keys to environment
for key in "${!key_pairs[@]}"; do
    value="${key_pairs[$key]}"
    export "$key=$value"
    
    # Mask value for display
    if [[ ${#value} -gt 6 ]]; then
        masked="${value:0:4}…${value: -2}"
    else
        masked="***"
    fi
    
    if [[ "$QUIET" == false ]]; then
        echo -e "${CYAN}Set ${key} = ${masked}${NC}"
    fi
    exported_count=$((exported_count + 1))
done

if [[ "$QUIET" == false ]]; then
    echo -e "${GREEN}Loaded ${exported_count} key(s).${NC}"
fi
