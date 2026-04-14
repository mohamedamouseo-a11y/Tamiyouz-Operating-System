#!/bin/bash
# Run before every push to verify no secrets
echo "=== Scanning for secrets ==="
FOUND=0

# ATTA tokens
ATTA=$(grep -rn --include="*.json" --include="*.ts" --include="*.js" \
  "ATTA[A-Za-z0-9]\{40,\}" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  | grep -v REDACTED | wc -l)
echo "Atlassian ATTA tokens: $ATTA"
[ "$ATTA" -gt 0 ] && FOUND=1

# key= in URLs
KEYS=$(grep -rn --include="*.json" "key=[a-fA-F0-9]\{20,\}" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  | grep -v REDACTED | wc -l)
echo "API keys in URLs: $KEYS"
[ "$KEYS" -gt 0 ] && FOUND=1

if [ "$FOUND" -eq 0 ]; then
  echo "✅ CLEAN - safe to push"
else
  echo "❌ SECRETS FOUND - do not push"
  exit 1
fi
