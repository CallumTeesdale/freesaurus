version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: thesaurus-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${postgres_user}
      POSTGRES_PASSWORD: ${postgres_password}
      POSTGRES_DB: ${postgres_db}
    volumes:
      - /data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${postgres_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - thesaurus-network

  meilisearch:
    image: getmeili/meilisearch:v1.13.3
    container_name: thesaurus-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${meili_master_key}
      MEILI_NO_ANALYTICS: true
      MEILI_ENV: production
      IMPORT_DUMP: ${import_dump}
    volumes:
      - /data/meilisearch:/meili_data/data.ms
      - /data/dumps:/meili_data/dumps
    entrypoint: ["/bin/sh", "-c", "if [ \"$$IMPORT_DUMP\" = \"true\" ] && [ -f /meili_data/dumps/wordnet.dump ]; then meilisearch --import-dump /meili_data/dumps/wordnet.dump; else meilisearch; fi"]
    ports:
      - "7700:7700"
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --spider http://127.0.0.1:7700/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - thesaurus-network

  thesaurus-api:
    image: ${api_image}
    container_name: thesaurus-api
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://${postgres_user}:${postgres_password}@postgres:5432/${postgres_db}
      MEILI_URL: http://meilisearch:7700
      MEILI_MASTER_KEY: ${meili_master_key}
      JWT_SECRET: ${jwt_secret}
      JWT_EXPIRES_IN: ${jwt_expires_in}
      JWT_MAXAGE: ${jwt_maxage}
      RUST_LOG: info
      PORT: 3000
      HOST: 0.0.0.0
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      meilisearch:
        condition: service_healthy
    networks:
      - thesaurus-network

  thesaurus-frontend:
    image: ${frontend_image}
    container_name: thesaurus-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: ${domain != "" ? "https://${domain}/api" : "/api"}
    ports:
      - "8080:80"
    depends_on:
      - thesaurus-api
    networks:
      - thesaurus-network

networks:
  thesaurus-network:
    driver: bridge