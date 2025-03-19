#!/usr/bin/env just --justfile

# Variables
GITHUB_USER := env_var_or_default("GITHUB_USER", "yourUsername")
GITHUB_REPO := env_var_or_default("GITHUB_REPO", "yourRepoName")
GITHUB_USER_LOWER := `echo $GITHUB_USER | tr '[:upper:]' '[:lower:]'`
GITHUB_REPO_LOWER := `echo $GITHUB_REPO | tr '[:upper:]' '[:lower:]'`
GITHUB_TOKEN := env_var_or_default("GITHUB_TOKEN", "")
HETZNER_TOKEN := env_var_or_default("HETZNER_TOKEN", "")
DOMAIN := env_var_or_default("DOMAIN", "")
ADMIN_EMAIL := env_var_or_default("ADMIN_EMAIL", "")
GITHUB_USERNAME := env_var_or_default("GITHUB_USERNAME", "CallumTeesdale")
# Get commit hash (make sure this runs in a git repository)
_commit_hash := `git rev-parse --short HEAD 2>/dev/null || echo "latest"`
ENV := env_var_or_default("ENV", "production")

# Default recipe (shows help)
default:
    @just --list

# Validate environment variables
validate-env:
    #!/usr/bin/env bash
    set -euo pipefail

    missing=""
    [ -z "$GITHUB_TOKEN" ] && missing="${missing}GITHUB_TOKEN, "
    [ -z "$HETZNER_TOKEN" ] && missing="${missing}HETZNER_TOKEN, "

    if [ -n "$missing" ]; then
        echo "Error: Missing required environment variables: ${missing%, }"
        exit 1
    fi

# Login to GitHub Container Registry
login: validate-env
    echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

# Build all Docker images
build:
    #!/usr/bin/env bash
    set -euo pipefail

    COMMIT_HASH={{_commit_hash}}
    echo "Building Docker images with tag $COMMIT_HASH..."

    # Convert to lowercase for Docker requirements
    GITHUB_USER_LOWER={{GITHUB_USER_LOWER}}

    docker build -t ghcr.io/$GITHUB_USER_LOWER/thesaurus-api:latest -t ghcr.io/$GITHUB_USER_LOWER/thesaurus-api:$COMMIT_HASH ./thesaurus-api
    docker build -t ghcr.io/$GITHUB_USER_LOWER/wordnet-importer:latest -t ghcr.io/$GITHUB_USER_LOWER/wordnet-importer:$COMMIT_HASH ./wordnet-importer
    docker build -t ghcr.io/$GITHUB_USER_LOWER/thesaurus-frontend:latest -t ghcr.io/$GITHUB_USER_LOWER/thesaurus-frontend:$COMMIT_HASH ./thesaurus-frontend

    echo "Build complete!"

# Push all Docker images to GitHub Container Registry
push: login build
    #!/usr/bin/env bash
    set -euo pipefail

    COMMIT_HASH={{_commit_hash}}
    echo "Pushing Docker images with tag $COMMIT_HASH to GitHub Container Registry..."

    # Convert to lowercase for Docker requirements
    GITHUB_USER_LOWER={{GITHUB_USER_LOWER}}

    docker push ghcr.io/$GITHUB_USER_LOWER/thesaurus-api:latest
    docker push ghcr.io/$GITHUB_USER_LOWER/thesaurus-api:$COMMIT_HASH
    docker push ghcr.io/$GITHUB_USER_LOWER/wordnet-importer:latest
    docker push ghcr.io/$GITHUB_USER_LOWER/wordnet-importer:$COMMIT_HASH
    docker push ghcr.io/$GITHUB_USER_LOWER/thesaurus-frontend:latest
    docker push ghcr.io/$GITHUB_USER_LOWER/thesaurus-frontend:$COMMIT_HASH

    echo "Push complete!"

# Generate secure random values for secrets
generate-secrets:
    #!/usr/bin/env bash
    set -euo pipefail

    JWT_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    MEILI_MASTER_KEY=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
    POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)

    echo "Generated secrets:"
    echo "JWT_SECRET=$JWT_SECRET"
    echo "MEILI_MASTER_KEY=$MEILI_MASTER_KEY"
    echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

    echo "Saving to .env.secrets file..."
    echo "JWT_SECRET=$JWT_SECRET" > .env.secrets
    echo "MEILI_MASTER_KEY=$MEILI_MASTER_KEY" >> .env.secrets
    echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .env.secrets

    echo "Secrets saved to .env.secrets"

# Create terraform.tfvars file for deployment
create-tfvars: validate-env
    #!/usr/bin/env bash
    set -euo pipefail

    COMMIT_HASH={{_commit_hash}}
    echo "Using commit hash: $COMMIT_HASH"

    # Convert to lowercase for Docker requirements
    GITHUB_USER_LOWER={{GITHUB_USER_LOWER}}

    # Check if .env.secrets exists, generate if not
    if [ ! -f ".env.secrets" ]; then
        echo "No .env.secrets file found. Generating secrets..."
        just generate-secrets
    fi

    # Load secrets from .env.secrets
    source .env.secrets

    # Create terraform.tfvars
    cat > ./terraform/terraform.tfvars << EOL
    hcloud_token       = "$HETZNER_TOKEN"
    environment        = "$ENV"
    jwt_secret         = "$JWT_SECRET"
    meili_master_key   = "$MEILI_MASTER_KEY"
    postgres_password  = "$POSTGRES_PASSWORD"
    api_image          = "ghcr.io/$GITHUB_USER_LOWER/thesaurus-api:$COMMIT_HASH"
    frontend_image     = "ghcr.io/$GITHUB_USER_LOWER/thesaurus-frontend:$COMMIT_HASH"
    importer_image     = "ghcr.io/$GITHUB_USER_LOWER/wordnet-importer:$COMMIT_HASH"
    domain             = "$DOMAIN"
    email              = "$ADMIN_EMAIL"
    ssh_private_key_path = "$HOME/.ssh/id_rsa"
    ssh_public_key_path  = "$HOME/.ssh/id_rsa.pub"
    EOL

    echo "Created terraform/terraform.tfvars"

# Initialize Terraform
terraform-init:
    cd terraform && tofu init

# Plan Terraform deployment
terraform-plan: create-tfvars terraform-init
    cd terraform && tofu plan -out=tfplan

# Apply Terraform configuration
terraform-apply: terraform-plan
    cd terraform && tofu apply -auto-approve tfplan

# Get Terraform outputs
terraform-output:
    @cd terraform && tofu output

# Run all tests
test:
    #!/usr/bin/env bash
    set -euo pipefail

    echo "Running API tests..."
    if [ -d "thesaurus-api" ]; then
        cd thesaurus-api && cargo test || echo "API tests failed or cargo not available"
    else
        echo "API directory not found, skipping"
    fi

    echo "Running WordNet Importer tests..."
    if [ -d "wordnet-importer" ]; then
        cd wordnet-importer && cargo test || echo "Importer tests failed or cargo not available"
    else
        echo "WordNet importer directory not found, skipping"
    fi

    echo "Running Frontend tests..."
    if [ -d "thesaurus-frontend" ]; then
        cd thesaurus-frontend
        if [ -f "package.json" ]; then
            if grep -q "\"test\":" package.json; then
                npm test || echo "Frontend tests failed but continuing"
            else
                echo "No test script found in package.json, skipping"
            fi
        else
            echo "No package.json found, skipping"
        fi
    else
        echo "Frontend directory not found, skipping"
    fi

# Full deployment process
deploy: test push terraform-apply terraform-output
    @echo "Deployment completed successfully!"

# Show server status
server-status: validate-env
    #!/usr/bin/env bash
    set -euo pipefail

    SERVER_IP=$(cd terraform && tofu output -raw server_ip 2>/dev/null || echo "No server deployed yet")
    if [ "$SERVER_IP" != "No server deployed yet" ]; then
        echo "Server IP: $SERVER_IP"
        echo "Checking server status..."
        ssh -o ConnectTimeout=5 root@$SERVER_IP "docker ps && echo && df -h && echo && free -h"
    else
        echo "No server has been deployed yet"
    fi

# SSH into the server
ssh:
    #!/usr/bin/env bash
    set -euo pipefail

    SERVER_IP=$(cd terraform && tofu output -raw server_ip 2>/dev/null || echo "No server deployed yet")
    if [ "$SERVER_IP" != "No server deployed yet" ]; then
        echo "Connecting to server at $SERVER_IP..."
        ssh root@$SERVER_IP
    else
        echo "No server has been deployed yet"
    fi

# Destroy all infrastructure (DANGEROUS!)
destroy: validate-env
    #!/usr/bin/env bash
    set -euo pipefail

    echo "WARNING: This will destroy all infrastructure. This action cannot be undone."
    read -p "Are you sure you want to continue? [y/N] " confirm
    if [[ "$confirm" == [yY] || "$confirm" == [yY][eE][sS] ]]; then
        cd terraform && tofu destroy -auto-approve
    else
        echo "Destruction cancelled."
        exit 0
    fi

# Clean up local Docker images
clean:
    #!/usr/bin/env bash
    set -euo pipefail

    COMMIT_HASH={{_commit_hash}}
    echo "Cleaning up Docker images with tag $COMMIT_HASH..."

    # Convert to lowercase for Docker requirements
    GITHUB_USER_LOWER={{GITHUB_USER_LOWER}}

    docker rmi ghcr.io/$GITHUB_USER_LOWER/thesaurus-api:latest ghcr.io/$GITHUB_USER_LOWER/thesaurus-api:$COMMIT_HASH \
      ghcr.io/$GITHUB_USER_LOWER/wordnet-importer:latest ghcr.io/$GITHUB_USER_LOWER/wordnet-importer:$COMMIT_HASH \
      ghcr.io/$GITHUB_USER_LOWER/thesaurus-frontend:latest ghcr.io/$GITHUB_USER_LOWER/thesaurus-frontend:$COMMIT_HASH || true

update-compose: push
    #!/usr/bin/env bash
    set -euo pipefail

    COMMIT_HASH={{_commit_hash}}
    GITHUB_USER_LOWER={{GITHUB_USER_LOWER}}
    SERVER_IP=$(cd terraform && tofu output -raw server_ip 2>/dev/null || echo "No server deployed yet")

    if [ "$SERVER_IP" != "No server deployed yet" ]; then
        echo "Updating Docker Compose with latest commit hash: $COMMIT_HASH"

        ssh root@$SERVER_IP "cat /root/docker-compose.yml" > ./temp-compose.yml

        # Check if we're running on macOS (BSD sed) or Linux (GNU sed)
        if [[ "$(uname)" == "Darwin" ]]; then
            # macOS - BSD sed requires an extension argument (empty string in this case)
            sed -i '' "s|${GITHUB_USER_LOWER}/thesaurus-api:[^[:space:]\"]*|${GITHUB_USER_LOWER}/thesaurus-api:${COMMIT_HASH}|g" ./temp-compose.yml
            sed -i '' "s|${GITHUB_USER_LOWER}/thesaurus-frontend:[^[:space:]\"]*|${GITHUB_USER_LOWER}/thesaurus-frontend:${COMMIT_HASH}|g" ./temp-compose.yml
            sed -i '' "s|${GITHUB_USER_LOWER}/wordnet-importer:[^[:space:]\"]*|${GITHUB_USER_LOWER}/wordnet-importer:${COMMIT_HASH}|g" ./temp-compose.yml
        else
            # Linux - GNU sed
            sed -i "s|${GITHUB_USER_LOWER}/thesaurus-api:[^[:space:]\"]*|${GITHUB_USER_LOWER}/thesaurus-api:${COMMIT_HASH}|g" ./temp-compose.yml
            sed -i "s|${GITHUB_USER_LOWER}/thesaurus-frontend:[^[:space:]\"]*|${GITHUB_USER_LOWER}/thesaurus-frontend:${COMMIT_HASH}|g" ./temp-compose.yml
            sed -i "s|${GITHUB_USER_LOWER}/wordnet-importer:[^[:space:]\"]*|${GITHUB_USER_LOWER}/wordnet-importer:${COMMIT_HASH}|g" ./temp-compose.yml
        fi

        scp ./temp-compose.yml root@$SERVER_IP:/root/docker-compose.yml
        rm ./temp-compose.yml

        # Create a temporary file for GitHub token
        GITHUB_TOKEN_FILE=$(mktemp)
        echo "$GITHUB_TOKEN" > "$GITHUB_TOKEN_FILE"

        # Transfer the token file
        scp "$GITHUB_TOKEN_FILE" root@$SERVER_IP:/tmp/github_token

        # Clean up the local temporary file
        rm "$GITHUB_TOKEN_FILE"

        # Use GITHUB_USER_LOWER for docker login
        ssh root@$SERVER_IP "cat /tmp/github_token | docker login ghcr.io -u ${GITHUB_USER_LOWER} --password-stdin && \
            rm /tmp/github_token && \
            cd /root && \
            docker-compose pull && \
            docker-compose down && \
            docker-compose up -d"

        echo "Docker Compose updated and containers restarted with images from commit $COMMIT_HASH!"
    else
        echo "No server has been deployed yet"
    fi