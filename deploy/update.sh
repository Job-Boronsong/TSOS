#!/usr/bin/env bash
# TSOS Update Script — run this whenever you pull new code to the VPS.
# Usage: cd /opt/tsos && git pull && ./deploy/update.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE="docker compose -f $SCRIPT_DIR/docker-compose.yml --env-file $SCRIPT_DIR/.env"

echo "╔══════════════════════════════════════════════════════╗"
echo "║           TSOS Update                               ║"
echo "╚══════════════════════════════════════════════════════╝"

echo ""
echo "▶ Building updated Docker images..."
cd "$SCRIPT_DIR/.."
$COMPOSE build api web
echo "  ✓ Images built"

echo ""
echo "▶ Running database migrations..."
$COMPOSE run --rm migrate
echo "  ✓ Migrations applied"

echo ""
echo "▶ Restarting app services..."
$COMPOSE up -d api web
echo "  ✓ API and web restarted"

echo ""
echo "▶ Checking service health..."
sleep 3
$COMPOSE ps api web

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Update complete!                                ║"
echo "║                                                      ║"
echo "║  Logs:  docker compose -f /opt/tsos/deploy/docker-compose.yml logs -f api"
echo "╚══════════════════════════════════════════════════════╝"
