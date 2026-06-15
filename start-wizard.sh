#!/usr/bin/env bash
set -e
exec "$(dirname "${BASH_SOURCE[0]}")/wizard/start-wizard.sh" "$@"
