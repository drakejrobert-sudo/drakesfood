#!/usr/bin/env bash
set -euo pipefail

trivy=$1
temp_dir=$2
scan_dir=$(mktemp -d "$temp_dir/security-infra.XXXXXX")

trap 'rm -rf "$scan_dir"' EXIT

git ls-files -z -- 'infra/*.tf' 'infra/*.tf.json' > "$scan_dir/paths"
if [[ ! -s "$scan_dir/paths" ]]; then
  echo 'Scanner error: no tracked OpenTofu configuration files were found.' >> "$GITHUB_STEP_SUMMARY"
  exit 1
fi

while IFS= read -r -d '' path; do
  if [[ ! -f "$path" || -L "$path" ]]; then
    echo 'Scanner error: expected regular OpenTofu source files.' >> "$GITHUB_STEP_SUMMARY"
    exit 1
  fi
  mkdir -p "$scan_dir/source/$(dirname "$path")"
  cp "$path" "$scan_dir/source/$path"
done < "$scan_dir/paths"

status=0
"$trivy" config --misconfig-scanners terraform --skip-check-update --skip-version-check \
  --cache-dir "$scan_dir/cache" --exit-code 0 --format json --output "$scan_dir/report.json" \
  "$scan_dir/source/infra" > "$scan_dir/stdout" 2> "$scan_dir/stderr" || status=$?

# Trivy can return success after logging a parse error. A fresh cache is
# intentionally empty, so the message about using embedded checks is expected.
if awk -F '\t' '$2 == "ERROR" && $3 != "[misconfig] Falling back to embedded checks" { error = 1 } END { exit !error }' "$scan_dir/stderr"; then
  status=1
fi

node tools/security-scan/summarize.mjs terraform "$scan_dir/report.json" "$status"
