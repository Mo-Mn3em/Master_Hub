# Backend — PHP 8.3 + Laravel (artisan serve)
FROM php:8.4-cli

# Install system dependencies + PHP extensions Laravel commonly needs
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql exif pcntl bcmath zip mbstring gd intl xml dom \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/backend

# Copy composer files first (layer caching)
COPY composer.json composer.lock ./

# Install PHP dependencies
# --ignore-platform-reqs: avoids false "extension missing" errors during build
# COMPOSER_MEMORY_LIMIT=-1: removes memory cap to prevent OOM kills
RUN COMPOSER_MEMORY_LIMIT=-1 composer install \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction \
    --ignore-platform-reqs

# Copy the rest of the application
COPY . .

# Generate optimised autoloader now that all files are present
# --no-scripts: skip package:discover here (no .env / DB yet) — run it in the entrypoint instead
RUN COMPOSER_MEMORY_LIMIT=-1 composer dump-autoload --optimize --no-interaction --no-scripts

# Create .env from .env.example if it doesn't exist
RUN cp -n .env.example .env || true

# Make the entrypoint script executable
RUN chmod +x /var/www/backend/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/var/www/backend/docker-entrypoint.sh"]