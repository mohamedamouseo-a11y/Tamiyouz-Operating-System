#!/bin/bash
APP_DIR="/var/www/tamiyouz_tos"
LOG_FILE="/var/log/tos-deploy.log"
PM2_APP="tamiyouz-tos"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"; }

cd "$APP_DIR"

log "[INFO] Fetching from GitHub..."
/usr/bin/git fetch origin main >> "$LOG_FILE" 2>&1

LOCAL=$(git rev-parse HEAD 2>/dev/null || echo 'none')
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo 'unknown')

if [ "$LOCAL" = "$REMOTE" ]; then
  log "[INFO] No changes. Up to date (${LOCAL:0:7})"
  exit 0
fi

log "[INFO] New changes: ${LOCAL:0:7} -> ${REMOTE:0:7}"
log "[INFO] Syncing with GitHub..."

/usr/bin/git fetch --all >> "$LOG_FILE" 2>&1
/usr/bin/git checkout -f origin/main -- . >> "$LOG_FILE" 2>&1
/usr/bin/git merge origin/main >> "$LOG_FILE" 2>&1

log "[INFO] Installing dependencies..."
pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1

log "[INFO] Building..."
pnpm run build >> "$LOG_FILE" 2>&1

log "[INFO] Restarting PM2..."
pm2 restart "$PM2_APP" --update-env >> "$LOG_FILE" 2>&1

log "[SUCCESS] Deployed commit ${REMOTE:0:7}"
