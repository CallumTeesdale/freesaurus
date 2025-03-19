#!/bin/bash
set -euo pipefail


GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Thesaurus Platform Deployment Setup ===${NC}"


mkdir -p terraform/templates terraform/files


for cmd in tofu jq openssl; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}Error: $cmd is not installed${NC}"
    exit 1
  fi
done


if [ ! -d "terraform/.terraform" ]; then
  echo -e "${GREEN}Initializing Terraform...${NC}"
  (cd terraform && tofu init)
fi


if [ ! -f "terraform/terraform.tfvars" ]; then
  echo -e "${GREEN}Creating terraform.tfvars file...${NC}"


  if [ -f "terraform/terraform.tfvars.example" ]; then
    cp terraform/terraform.tfvars.example terraform/terraform.tfvars
  else

    cat > terraform/terraform.tfvars << EOF
# Required variables
hcloud_token       = "your_hetzner_api_token"
jwt_secret         = "your_secure_jwt_secret"
meili_master_key   = "your_secure_meilisearch_key"
postgres_password  = "your_secure_postgres_password"

# Optional variables
environment        = "production"  # or "staging"
server_name        = "thesaurus"
region             = "fsn1"        # Falkenstein, Germany
server_type        = "cax11"       # ARM-based Ampere instance with 2 vCPUs, 4 GB RAM
volume_size        = 50            # in GB

# SSH key paths (adjust for your system)
ssh_public_key_path  = "~/.ssh/id_rsa.pub"
ssh_private_key_path = "~/.ssh/id_rsa"

# Docker images
api_image         = "ghcr.io/your_username/thesaurus-api:latest"
frontend_image    = "ghcr.io/your_username/thesaurus-frontend:latest"
importer_image    = "ghcr.io/your_username/wordnet-importer:latest"

# Domain configuration (optional)
domain            = "" # Set to your domain if you want SSL
email             = "admin@example.com" # Used for SSL certificate notifications
EOF
  fi


  JWT_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
  MEILI_MASTER_KEY=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
  POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)


  sed -i.bak "s/your_secure_jwt_secret/$JWT_SECRET/g" terraform/terraform.tfvars
  sed -i.bak "s/your_secure_meilisearch_key/$MEILI_MASTER_KEY/g" terraform/terraform.tfvars
  sed -i.bak "s/your_secure_postgres_password/$POSTGRES_PASSWORD/g" terraform/terraform.tfvars


  rm -f terraform/terraform.tfvars.bak

  echo -e "${GREEN}Generated secure random tokens.${NC}"
  echo "JWT_SECRET=$JWT_SECRET"
  echo "MEILI_MASTER_KEY=$MEILI_MASTER_KEY"
  echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

  read -p "Enter your Hetzner Cloud API token: " HCLOUD_TOKEN
  sed -i.bak "s/your_hetzner_api_token/$HCLOUD_TOKEN/g" terraform/terraform.tfvars
  rm -f terraform/terraform.tfvars.bak


  if [ ! -f ~/.ssh/id_rsa.pub ]; then
    echo -e "${BLUE}No SSH key found. Generating a new one...${NC}"
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
  fi
fi


echo -e "${GREEN}Checking required files...${NC}"


if [ ! -f "terraform/files/docker-compose.yml" ]; then
  echo -e "${GREEN}Creating docker-compose.yml...${NC}"
  mkdir -p terraform/files
  cat > terraform/files/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: thesaurus-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - /data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - thesaurus-network

  meilisearch:
    image: getmeili/meilisearch:latest
    container_name: thesaurus-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_NO_ANALYTICS: true
      MEILI_ENV: production
    volumes:
      - /data/meilisearch:/data.ms
    ports:
      - "7700:7700"
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --spider http://localhost:7700/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - thesaurus-network

  thesaurus-api:
    image: ${API_IMAGE}
    container_name: thesaurus-api
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      MEILI_URL: ${MEILI_URL}
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      JWT_MAXAGE: ${JWT_MAXAGE}
      RUST_LOG: ${RUST_LOG}
      PORT: ${API_PORT}
      HOST: ${API_HOST}
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
    image: ${FRONTEND_IMAGE}
    container_name: thesaurus-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: ${REACT_APP_API_URL}
    ports:
      - "8080:80"
    depends_on:
      - thesaurus-api
    networks:
      - thesaurus-network

networks:
  thesaurus-network:
    driver: bridge
EOF
fi


if [ ! -f "terraform/templates/env.tpl" ]; then
  echo -e "${GREEN}Creating env.tpl...${NC}"
  mkdir -p terraform/templates
  cat > terraform/templates/env.tpl << 'EOF'
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
EOF
fi

read -p "Ready to deploy? This will create resources on Hetzner Cloud. (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Deployment cancelled.${NC}"
  exit 0
fi


echo -e "${GREEN}Starting deployment...${NC}"
(cd terraform && tofu plan -out=tfplan && tofu apply -auto-approve tfplan)


if [ $? -eq 0 ]; then
  echo -e "${BLUE}=== Deployment Complete ===${NC}"
  SERVER_IP=$(cd terraform && tofu output -raw server_ip)
  echo -e "${GREEN}Server IP: $SERVER_IP${NC}"

  if command -v terraform output >/dev/null 2>&1; then
    APP_URL=$(cd terraform && tofu output -raw app_url 2>/dev/null || echo "http://$SERVER_IP")
    API_URL=$(cd terraform && tofu output -raw api_url 2>/dev/null || echo "http://$SERVER_IP/api")
    MEILI_URL=$(cd terraform && tofu output -raw meilisearch_url 2>/dev/null || echo "http://$SERVER_IP:7700")

    echo -e "${GREEN}Application URL: $APP_URL${NC}"
    echo -e "${GREEN}API URL: $API_URL${NC}"
    echo -e "${GREEN}MeiliSearch URL: $MEILI_URL${NC}"
  fi

  echo
  echo -e "${GREEN}SSH Access: ssh root@$SERVER_IP${NC}"
  echo
  echo -e "${BLUE}Note: It may take a few minutes for all services to start and for WordNet data to be imported.${NC}"
else
  echo -e "${RED}Deployment failed. Check the error messages above.${NC}"
fi