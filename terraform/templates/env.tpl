# Database settings
POSTGRES_USER=${postgres_user}
POSTGRES_PASSWORD=${postgres_password}
POSTGRES_DB=${postgres_db}
DATABASE_URL=postgres://${postgres_user}:${postgres_password}@postgres:5432/${postgres_db}

# MeiliSearch settings
MEILI_MASTER_KEY=${meili_master_key}
MEILI_URL=http://meilisearch:7700

# JWT settings
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=${jwt_expires_in}
JWT_MAXAGE=${jwt_maxage}

# API settings
API_PORT=3000
API_HOST=0.0.0.0
RUST_LOG=info

# Docker images
API_IMAGE=${api_image}
FRONTEND_IMAGE=${frontend_image}
IMPORTER_IMAGE=${importer_image}

# Frontend settings
REACT_APP_API_URL=${domain != "" ? "https://${domain}/api" : "/api"}