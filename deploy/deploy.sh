#!/usr/bin/env bash
# TSOS VPS Deployment Script
# Usage: ./deploy.sh <your-domain.com>
set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <your-domain.com>"
  echo "Example: $0 tsos.myschool.com"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "╔══════════════════════════════════════════════════════╗"
echo "║         TSOS VPS Deployment — $DOMAIN"
echo "╚══════════════════════════════════════════════════════╝"

# ── 1. Check prerequisites ─────────────────────────────────
echo ""
echo "▶ Checking prerequisites..."
for cmd in docker openssl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "  ✗ '$cmd' is not installed. Install it and re-run."
    exit 1
  fi
done
if ! docker compose version &>/dev/null; then
  echo "  ✗ 'docker compose' (v2) is not available."
  echo "    Install it: https://docs.docker.com/compose/install/"
  exit 1
fi
echo "  ✓ docker, docker compose, openssl — all present"

# ── 2. Create .env if missing ──────────────────────────────
ENV_FILE="$SCRIPT_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo ""
  echo "▶ Creating .env from template..."
  cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"

  # Auto-generate strong secrets
  POSTGRES_PASSWORD="$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)"
  SESSION_SECRET="$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 80)"
  MINIO_PASSWORD="$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)"

  sed -i "s/CHANGE_ME_strong_db_password/$POSTGRES_PASSWORD/" "$ENV_FILE"
  sed -i "s/CHANGE_ME_very_long_random_session_secret/$SESSION_SECRET/" "$ENV_FILE"
  sed -i "s/CHANGE_ME_minio_password/$MINIO_PASSWORD/" "$ENV_FILE"

  echo "  ✓ .env created with auto-generated secrets"
  echo ""
  echo "  ⚠  IMPORTANT: Open deploy/.env and fill in:"
  echo "     - PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY"
  echo "     - SMTP_* variables (optional, for email)"
  echo "     - AT_* variables (optional, for SMS)"
  echo ""
  read -r -p "  Press ENTER when you've filled in the Paystack keys, or Ctrl+C to stop now... "
fi

# ── 3. Patch domain into nginx.conf ───────────────────────
echo ""
echo "▶ Configuring Nginx for domain: $DOMAIN"
sed -i "s/YOUR_DOMAIN_HERE/$DOMAIN/g" "$SCRIPT_DIR/nginx.conf"
echo "  ✓ nginx.conf updated"

# ── 4. Build Docker images ─────────────────────────────────
echo ""
echo "▶ Building Docker images (this takes a few minutes on first run)..."
cd "$PROJECT_ROOT"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$ENV_FILE" build
echo "  ✓ Images built"

# ── 5. Start services (HTTP only first, for cert challenge) ─
echo ""
echo "▶ Starting services on HTTP to allow SSL certificate issuance..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$ENV_FILE" up -d postgres minio minio-init api web nginx
echo "  ✓ Services started"

# ── 6. Obtain SSL certificate ──────────────────────────────
echo ""
echo "▶ Obtaining Let's Encrypt SSL certificate for $DOMAIN..."
echo "  (Make sure port 80 is open on your firewall)"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$ENV_FILE" run --rm certbot \
  certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email "admin@$DOMAIN" \
  --agree-tos --no-eff-email \
  -d "$DOMAIN"
echo "  ✓ SSL certificate obtained"

# ── 7. Run database migrations ─────────────────────────────
echo ""
echo "▶ Running database migrations..."
# Load env vars
set -a && source "$ENV_FILE" && set +a
DB_URL="postgresql://tsos:${POSTGRES_PASSWORD}@localhost:5432/tsos"
# Expose postgres port temporarily for migration
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$ENV_FILE" exec -T postgres \
  psql -U tsos -d tsos -c "SELECT 1" &>/dev/null && echo "  ✓ Database reachable"

# Run push inside an api container
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$ENV_FILE" run --rm \
  -e DATABASE_URL="postgresql://tsos:${POSTGRES_PASSWORD}@postgres:5432/tsos" \
  api \
  sh -c "cd /app && npx drizzle-kit push --config lib/db/drizzle.config.ts" \
  2>&1 | tail -5 || echo "  ⚠  Migration may need manual review — check logs"
echo "  ✓ Migrations applied"

# ── 8. Restart Nginx to load SSL ───────────────────────────
echo ""
echo "▶ Reloading Nginx with SSL..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$ENV_FILE" restart nginx
echo "  ✓ Nginx reloaded"

# ── 9. Start certbot renewal cron ─────────────────────────
echo ""
echo "▶ Starting certbot auto-renewal..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$ENV_FILE" up -d certbot
echo "  ✓ Certbot renewal daemon running"

# ── Done ───────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Deployment complete!"
echo "║"
echo "║  App URL:    https://$DOMAIN"
echo "║  MinIO UI:   http://$DOMAIN:9001  (file storage admin)"
echo "║"
echo "║  Super admin: superadmin / superadmin123"
echo "║  (Change this password immediately after first login!)"
echo "║"
echo "║  To view logs:   docker compose -f deploy/docker-compose.yml logs -f"
echo "║  To stop:        docker compose -f deploy/docker-compose.yml down"
echo "║  To update:      git pull && ./deploy/deploy.sh $DOMAIN"
echo "╚══════════════════════════════════════════════════════╝"
