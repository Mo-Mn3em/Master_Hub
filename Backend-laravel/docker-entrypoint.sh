#!/bin/bash
set -e

echo "Starting Master Hub Backend..."

# ── 1. Ensure .env exists ──────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo ".env not found, copying from .env.example..."
    cp .env.example .env
fi

# ── 2. Override DB config to point to the Docker MySQL container ───────────
sed -i "s|DB_HOST=.*|DB_HOST=db|g" .env
sed -i "s|DB_PORT=.*|DB_PORT=3306|g" .env
sed -i "s|DB_CONNECTION=.*|DB_CONNECTION=mysql|g" .env
sed -i "s|DB_DATABASE=.*|DB_DATABASE=Master_Hub|g" .env
sed -i "s|DB_USERNAME=.*|DB_USERNAME=root|g" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=root|g" .env

# ── 3. Generate app key if missing ────────────────────────────────────────
if grep -q "^APP_KEY=$" .env || ! grep -q "^APP_KEY=" .env; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# ── 4. Wait for MySQL to be ready ─────────────────────────────────────────
echo "Waiting for MySQL to be ready..."
MAX_TRIES=30
COUNT=0
until php artisan db:show > /dev/null 2>&1; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -ge "$MAX_TRIES" ]; then
        echo "MySQL did not become ready in time. Exiting."
        exit 1
    fi
    echo "MySQL not ready yet, retrying in 2s... ($COUNT/$MAX_TRIES)"
    sleep 2
done
echo "MySQL is ready!"

# ── 5. Run migrations (safe — only applies new ones) ─────────────────────
echo "Running database migrations..."
php artisan migrate --force

# ── 6. Clear and cache config ─────────────────────────────────────────────
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# ── 7. Start Laravel dev server ───────────────────────────────────────────
echo "Master Hub Backend is running on port 8000"
php artisan package:discover --ansi || true
exec php artisan serve --host=0.0.0.0 --port=8000
