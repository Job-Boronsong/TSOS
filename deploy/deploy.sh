#!/usr/bin/env bash
# TSOS VPS Deployment Script
# Usage: ./deploy/deploy.sh <your-domain.com>
#
# Assumes the server already runs nginx (serving another site).
# TSOS API and web containers bind to localhost only; system nginx proxies them.
set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <your-domain.com>"
  echo "Example: $0 torrentialbsms.com"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE="docker compose -f $SCRIPT_DIR/docker-compose.yml --env-file $SCRIPT_DIR/.env"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

echo "╔══════════════════════════════════════════════════════╗"
echo "║     TSOS VPS Deployment — $DOMAIN"
echo "╚══════════════════════════════════════════════════════╝"

# ── 1. Check prerequisites ─────────────────────────────────────────────────
echo ""
echo "▶ Checking prerequisites..."
for cmd in docker nginx certbot openssl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "  ✗ '$cmd' is not installed."
    [[ "$cmd" == "certbot" ]] && echo "    Install with: sudo apt install -y certbot python3-certbot-nginx"
    [[ "$cmd" == "nginx" ]]   && echo "    Install with: sudo apt install -y nginx"
    exit 1
  fi
done
if ! docker compose version &>/dev/null; then
  echo "  ✗ Docker Compose v2 not found. Run: sudo apt install docker-compose-plugin"
  exit 1
fi
echo "  ✓ All prerequisites present"

# ── 2. Create .env if missing ──────────────────────────────────────────────
ENV_FILE="$SCRIPT_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo ""
  echo "▶ Creating .env with auto-generated secrets..."
  cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"
  sed -i "s/CHANGE_ME_strong_db_password/$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)/" "$ENV_FILE"
  sed -i "s/CHANGE_ME_very_long_random_session_secret/$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 80)/" "$ENV_FILE"
  sed -i "s/CHANGE_ME_minio_password/$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)/" "$ENV_FILE"
  echo "  ✓ .env created at $ENV_FILE"
fi

echo ""
echo "  ⚠  Open deploy/.env and fill in your PAYSTACK keys before continuing."
echo "     PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY (from dashboard.paystack.com)"
echo ""
read -r -p "  Press ENTER when ready (or Ctrl+C to cancel)... "

# ── 3. Build Docker images ─────────────────────────────────────────────────
echo ""
echo "▶ Building Docker images (may take 5-10 min on first run)..."
cd "$PROJECT_ROOT"
$COMPOSE build api web migrate
echo "  ✓ Images built"

# ── 4. Start infrastructure ────────────────────────────────────────────────
echo ""
echo "▶ Starting database and storage services..."
$COMPOSE up -d postgres minio
echo "  Waiting for postgres to be healthy..."
$COMPOSE up --wait postgres
echo "  Waiting for MinIO to start (15s)..."
sleep 15
$COMPOSE run --rm minio-init
echo "  ✓ Infrastructure ready"

# ── 5. Run database migrations ────────────────────────────────────────────
echo ""
echo "▶ Running database migrations..."
$COMPOSE run --rm migrate
echo "  ✓ Migrations applied"

# ── 6. Start app services ─────────────────────────────────────────────────
echo ""
echo "▶ Starting API and web services..."
$COMPOSE up -d api web
echo "  ✓ App services started (API on 127.0.0.1:8080, web on 127.0.0.1:8082)"

# ── 7. Configure system nginx ─────────────────────────────────────────────
echo ""
echo "▶ Writing nginx site config for $DOMAIN..."
cat > "$NGINX_CONF" <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    # Certbot will add SSL config here automatically
    location / {
        return 301 https://\$host\$request_uri;
    }
}
NGINX

if [[ ! -f "/etc/nginx/sites-enabled/$DOMAIN" ]]; then
  ln -s "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMAIN"
fi

nginx -t && systemctl reload nginx
echo "  ✓ Nginx configured for $DOMAIN"

# ── 8. Obtain SSL certificate ─────────────────────────────────────────────
echo ""
echo "▶ Obtaining SSL certificate from Let's Encrypt..."
echo "  (Port 80 must be reachable from the internet)"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect
echo "  ✓ SSL certificate obtained and nginx updated to HTTPS"

# ── 9. Write the full TSOS nginx proxy config ─────────────────────────────
echo ""
echo "▶ Writing full TSOS reverse proxy config..."
# Certbot already added SSL — we just append the proxy locations
cat > "$NGINX_CONF" <<NGINX
# limit_req_zone must be at http context (outside server block)
limit_req_zone \$binary_remote_addr zone=tsos_api:10m rate=30r/s;
limit_req_zone \$binary_remote_addr zone=tsos_login:10m rate=5r/m;

server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location /api/ {
        limit_req zone=tsos_api burst=60 nodelay;
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    location ~ ^/api/(auth|teacher-auth)/login {
        limit_req zone=tsos_login burst=5 nodelay;
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }

    location /api/webhooks/ {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass         http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }
}
NGINX

nginx -t && systemctl reload nginx
echo "  ✓ Full HTTPS proxy config active"

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Deployment complete!"
echo "║"
echo "║  TSOS:      https://$DOMAIN"
echo "║  MinIO UI:  ssh tunnel → ssh -L 9001:localhost:9001 root@$DOMAIN"
echo "║             then open http://localhost:9001"
echo "║"
echo "║  Login: superadmin / superadmin123"
echo "║  ⚠  Change the superadmin password immediately!"
echo "║"
echo "║  Logs:   docker compose -f /opt/tsos/deploy/docker-compose.yml logs -f"
echo "║  Stop:   docker compose -f /opt/tsos/deploy/docker-compose.yml down"
echo "║  Update: git pull && ./deploy/deploy.sh $DOMAIN"
echo "╚══════════════════════════════════════════════════════╝"
