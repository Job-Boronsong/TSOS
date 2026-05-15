# TSOS VPS Deployment Guide

## What you're getting

Five Docker containers managed together:

| Container | What it does |
|-----------|-------------|
| `postgres` | Database (all your school data) |
| `minio` | File storage (passport photos, logos) |
| `api` | Express API server |
| `web` | React frontend (served as static files via Nginx) |
| `nginx` | Reverse proxy, SSL termination, rate limiting |

---

## Step 1 — Prepare your VPS

SSH into your server and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group (log out and back in after this)
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

Make sure ports **80** and **443** are open in your firewall:

```bash
# UFW (Ubuntu default)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw reload
```

---

## Step 2 — Copy the project to your VPS

On your **local machine** (or from Replit), push to GitHub first, then on the VPS:

```bash
# Option A: Clone from GitHub
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git tsos
cd tsos

# Option B: SCP the whole folder from your machine
# scp -r /path/to/project root@209.74.88.43:~/tsos
```

---

## Step 3 — Point your domain at the VPS

In your domain registrar's DNS settings, add an **A record**:

```
Type: A
Name: @   (or your subdomain, e.g. "app")
Value: 209.74.88.43
TTL: 300
```

Wait 5–15 minutes for DNS to propagate before the next step.

---

## Step 4 — Run the deploy script

```bash
cd ~/tsos
chmod +x deploy/deploy.sh
./deploy/deploy.sh your-domain.com
```

The script will:
1. Create a `.env` file with auto-generated secure passwords
2. Ask you to fill in your Paystack keys
3. Build the Docker images (~5 min on first run)
4. Get a free SSL certificate from Let's Encrypt
5. Run database migrations
6. Start everything

---

## Step 5 — Fill in your secrets

The script pauses and asks you to edit `deploy/.env`. Open it:

```bash
nano deploy/.env
```

Fill in:
```env
PAYSTACK_SECRET_KEY=sk_live_...   # from dashboard.paystack.com
PAYSTACK_PUBLIC_KEY=pk_live_...

# Optional — for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=TSOS <you@gmail.com>
```

Save, then press Enter in the terminal to continue.

---

## After deployment

### Access your app
- **App**: `https://your-domain.com`
- **MinIO file storage admin**: `http://209.74.88.43:9001`

### First login
Log in as super admin and **change the password immediately**:
- Username: `superadmin`
- Password: `superadmin123`

### Day-to-day commands

```bash
# View live logs
docker compose -f deploy/docker-compose.yml logs -f

# View only API logs
docker compose -f deploy/docker-compose.yml logs -f api

# Restart a single service
docker compose -f deploy/docker-compose.yml restart api

# Stop everything
docker compose -f deploy/docker-compose.yml down

# Update to latest code
git pull
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up -d
```

### Backups

Back up your database regularly:

```bash
# Dump the database
docker compose -f deploy/docker-compose.yml exec postgres \
  pg_dump -U tsos tsos > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20260101.sql | docker compose -f deploy/docker-compose.yml exec -T postgres \
  psql -U tsos tsos
```

---

## Troubleshooting

**"Certificate not found" / Nginx won't start with SSL**
The SSL cert must exist before Nginx loads the HTTPS block. The deploy script handles this, but if you run it manually:
```bash
# Start nginx on HTTP only, get the cert, then restart
docker compose -f deploy/docker-compose.yml up -d nginx
docker compose -f deploy/docker-compose.yml run --rm certbot certonly --webroot ...
docker compose -f deploy/docker-compose.yml restart nginx
```

**API won't connect to database**
```bash
docker compose -f deploy/docker-compose.yml logs postgres
docker compose -f deploy/docker-compose.yml logs api
```

**File uploads not working**
Check MinIO is healthy and the buckets were created:
```bash
docker compose -f deploy/docker-compose.yml logs minio
docker compose -f deploy/docker-compose.yml logs minio-init
```

**Check if everything is running**
```bash
docker compose -f deploy/docker-compose.yml ps
```

---

## Architecture on the VPS

```
Internet
    │
    ▼
 Nginx :443 (SSL)
    ├─► /api/*  ──────► api:8080  (Express)
    │                      │
    │                      ├─► postgres:5432
    │                      └─► minio:9000
    │
    └─► /*  ─────────► web:80  (Nginx static)
```
