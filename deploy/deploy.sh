#!/usr/bin/env bash
# TSOS VPS Deployment Script
# Usage: ./deploy/deploy.sh <your-domain.com>
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

echo "╔══════════════════════════════════════════════════════╗"
echo "║     TSOS VPS Deployment — $DOMAIN"
echo "╚══════════════════════════════════════════════════════╝"

# ── 1. Check prerequisites ─────────────────────────────────────────────────
echo ""
echo "▶ Checking prerequisites..."
for cmd in docker openssl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "  ✗ '$cmd' is not installed."
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
  echo "  ✓ .env created"
fi

echo ""
echo "  ⚠  Open deploy/.env and fill in your PAYSTACK keys before continuing."
echo "     PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY (from dashboard.paystack.com)"
echo ""
read -r -p "  Press ENTER when ready (or Ctrl+C to stop)... "

# ── 3. Build Docker images ─────────────────────────────────────────────────
echo ""
echo "▶ Building Docker images (may take 5-10 min on first run)..."
cd "$PROJECT_ROOT"
$COMPOSE build api web
echo "  ✓ Images built"

# ── 4. Start infrastructure (no nginx yet) ────────────────────────────────
echo ""
echo "▶ Starting database and storage services..."
$COMPOSE up -d postgres minio
echo "  Waiting for postgres and minio to be ready..."
$COMPOSE up --wait postgres minio
$COMPOSE up minio-init
echo "  ✓ Infrastructure ready"

# ── 5. Run database migrations ────────────────────────────────────────────
echo ""
echo "▶ Running database migrations..."
$COMPOSE build migrate
$COMPOSE run --rm migrate
echo "  ✓ Migrations applied"

# ── 6. Start app services ─────────────────────────────────────────────────
echo ""
echo "▶ Starting API and web services..."
$COMPOSE up -d api web
echo "  ✓ App services started"

# ── 7. Get SSL certificate ────────────────────────────────────────────────
# Phase A: start nginx with HTTP-only config (no SSL block yet)
echo ""
echo "▶ Starting Nginx on HTTP for SSL certificate issuance..."
cat > "$SCRIPT_DIR/nginx.conf" <<NGINX_HTTP
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name $DOMAIN;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / {
            return 200 'TSOS is starting up...';
            add_header Content-Type text/plain;
        }
    }
}
NGINX_HTTP
$COMPOSE up -d nginx
sleep 3

echo ""
echo "▶ Obtaining SSL certificate from Let's Encrypt for $DOMAIN..."
echo "  (Port 80 must be reachable from the internet)"
$COMPOSE run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email "admin@$DOMAIN" \
  --agree-tos --no-eff-email \
  --non-interactive \
  -d "$DOMAIN"
echo "  ✓ SSL certificate obtained"

# Phase B: replace with full HTTPS nginx config
echo ""
echo "▶ Switching Nginx to HTTPS..."
cat > "$SCRIPT_DIR/nginx.conf" <<NGINX_HTTPS
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name $DOMAIN;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / {
            return 301 https://\$host\$request_uri;
        }
    }

    server {
        listen 443 ssl;
        server_name $DOMAIN;

        ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_session_cache   shared:SSL:10m;
        ssl_session_timeout 10m;

        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy strict-origin-when-cross-origin always;

        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

        location /api/ {
            limit_req zone=api burst=60 nodelay;
            proxy_pass         http://api:8080;
            proxy_http_version 1.1;
            proxy_set_header   Host \$host;
            proxy_set_header   X-Real-IP \$remote_addr;
            proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto \$scheme;
            proxy_read_timeout 60s;
        }

        location ~ ^/api/(auth|teacher-auth)/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass         http://api:8080;
            proxy_http_version 1.1;
            proxy_set_header   Host \$host;
            proxy_set_header   X-Real-IP \$remote_addr;
            proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto \$scheme;
        }

        location /api/webhooks/ {
            proxy_pass         http://api:8080;
            proxy_http_version 1.1;
            proxy_set_header   Host \$host;
            proxy_set_header   X-Real-IP \$remote_addr;
            proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto \$scheme;
        }

        location / {
            proxy_pass         http://web:80;
            proxy_http_version 1.1;
            proxy_set_header   Host \$host;
            proxy_set_header   X-Forwarded-Proto \$scheme;
        }
    }
}
NGINX_HTTPS

$COMPOSE exec nginx nginx -s reload || $COMPOSE restart nginx
echo "  ✓ Nginx reloaded with HTTPS"

# ── 8. Start certbot auto-renewal ─────────────────────────────────────────
echo ""
echo "▶ Starting certbot renewal daemon..."
$COMPOSE up -d certbot
echo "  ✓ Auto-renewal running (checks every 12h)"

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Deployment complete!"
echo "║"
echo "║  App:       https://$DOMAIN"
echo "║  MinIO UI:  http://$DOMAIN:9001  (change password!)"
echo "║"
echo "║  Login: superadmin / superadmin123"
echo "║  Change the superadmin password immediately!"
echo "║"
echo "║  Logs:    docker compose -f deploy/docker-compose.yml logs -f"
echo "║  Stop:    docker compose -f deploy/docker-compose.yml down"
echo "║  Update:  git pull && ./deploy/deploy.sh $DOMAIN"
echo "╚══════════════════════════════════════════════════════╝"
