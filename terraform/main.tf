# Generate docker-compose.yml from template
resource "local_file" "docker_compose" {
  content = templatefile("${path.module}/templates/docker-compose.yml.tpl", {
    postgres_user     = var.postgres_user
    postgres_password = var.postgres_password
    postgres_db       = var.postgres_db
    jwt_secret        = var.jwt_secret
    jwt_expires_in    = var.jwt_expires_in
    jwt_maxage        = var.jwt_maxage
    meili_master_key  = var.meili_master_key
    api_image         = var.api_image
    frontend_image    = var.frontend_image
    importer_image    = var.importer_image
    domain            = var.domain
  })
  filename = "${path.module}/files/docker-compose.yml"
}


# Generate .env file from template
resource "local_file" "env_file" {
  content = templatefile("${path.module}/templates/env.tpl", {
    postgres_user     = var.postgres_user
    postgres_password = var.postgres_password
    postgres_db       = var.postgres_db
    jwt_secret        = var.jwt_secret
    jwt_expires_in    = var.jwt_expires_in
    jwt_maxage        = var.jwt_maxage
    meili_master_key  = var.meili_master_key
    api_image         = var.api_image
    frontend_image    = var.frontend_image
    importer_image    = var.importer_image
    domain            = var.domain
  })
  filename = "${path.module}/files/.env.generated"
}
resource "hcloud_ssh_key" "default" {
  name = "thesaurus-${var.environment}-key"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "hcloud_volume" "thesaurus_data" {
  name      = "thesaurus-data-${var.environment}"
  size      = var.volume_size
  location  = var.region
  format    = "ext4"
  automount = false
}

resource "hcloud_server" "thesaurus" {
  name        = "${var.server_name}-${var.environment}"
  server_type = var.server_type
  image       = var.os_type
  location    = var.region
  ssh_keys = [hcloud_ssh_key.default.id]
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  # Just a minimal user_data script
  user_data = <<-EOT
    #!/bin/bash
    touch /root/.server-created
  EOT

  provisioner "remote-exec" {
    inline = [
      "echo 'Waiting for server to be ready...'",
      "apt update",
      "apt install -y curl"
    ]
    connection {
      type    = "ssh"
      user    = "root"
      private_key = file(pathexpand(var.ssh_private_key_path))
      host    = self.ipv4_address
      timeout = "5m"
    }
  }

  depends_on = [hcloud_volume.thesaurus_data]
}

resource "hcloud_volume_attachment" "thesaurus_data" {
  volume_id = hcloud_volume.thesaurus_data.id
  server_id = hcloud_server.thesaurus.id
  automount = true
}

resource "hcloud_firewall" "thesaurus" {
  name = "thesaurus-firewall-${var.environment}"

  # Allow SSH access
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "3000"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "7700"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "icmp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_firewall_attachment" "thesaurus" {
  firewall_id = hcloud_firewall.thesaurus.id
  server_ids = [hcloud_server.thesaurus.id]
}

resource "null_resource" "setup_server" {
  triggers = {
    server_id = hcloud_server.thesaurus.id
  }

  # Wait for the server and volume to be ready
  depends_on = [
    hcloud_server.thesaurus,
    hcloud_volume_attachment.thesaurus_data,
    local_file.docker_compose,
    local_file.env_file
  ]

  # Setup script - all in one provisioner to ensure proper sequence
  provisioner "remote-exec" {
    inline = [
      "echo 'Setting up server dependencies...'",

      # Install dependencies
      "apt-get update",
      "apt-get upgrade -y",
      "apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release software-properties-common ufw fail2ban htop nano rsync tmux nginx",

      # Install Docker
      "curl -fsSL https://get.docker.com -o get-docker.sh",
      "sh get-docker.sh",
      "systemctl enable docker",
      "systemctl start docker",

      # Install Docker Compose
      "curl -L \"https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose",
      "chmod +x /usr/local/bin/docker-compose",

      # Setup directories
      "mkdir -p /data/postgres /data/meilisearch",
      "mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled",

      # Mount volume
      "echo \"Mounting volume: /dev/disk/by-id/scsi-0HC_Volume_${hcloud_volume.thesaurus_data.id}\"",
      "mkfs.ext4 -F /dev/disk/by-id/scsi-0HC_Volume_${hcloud_volume.thesaurus_data.id} || echo 'Filesystem already exists'",
      "echo \"/dev/disk/by-id/scsi-0HC_Volume_${hcloud_volume.thesaurus_data.id} /data ext4 discard,nofail,defaults 0 0\" >> /etc/fstab",
      "mount -a || echo 'Volume already mounted'",

      # Setup firewall
      "ufw default deny incoming",
      "ufw default allow outgoing",
      "ufw allow ssh",
      "ufw allow 80/tcp",
      "ufw allow 443/tcp",
      "ufw allow 3000/tcp",
      "ufw allow 7700/tcp",
      "echo y | ufw enable",

      # Enable fail2ban
      "systemctl enable fail2ban",
      "systemctl start fail2ban",

      # Create Docker network
      "docker network create thesaurus-network || echo 'Network already exists'"
    ]
    connection {
      type    = "ssh"
      user    = "root"
      private_key = file(pathexpand(var.ssh_private_key_path))
      host    = hcloud_server.thesaurus.ipv4_address
      timeout = "10m"
    }
  }

  # Copy docker-compose.yml
  provisioner "file" {
    source      = "${path.module}/files/docker-compose.yml"
    destination = "/root/docker-compose.yml"
    connection {
      type = "ssh"
      user = "root"
      private_key = file(pathexpand(var.ssh_private_key_path))
      host = hcloud_server.thesaurus.ipv4_address
    }
  }

  # Generate nginx configuration
  provisioner "remote-exec" {
    inline = [
      "cat > /etc/nginx/sites-available/thesaurus << EOL",
      "server {",
      "    listen 80;",
      "    listen [::]:80;",
      "    server_name _;",
      "    # Frontend",
      "    location / {",
      "        proxy_pass http://localhost:8080;",
      "        proxy_http_version 1.1;",
      "        proxy_set_header Upgrade \\$http_upgrade;",
      "        proxy_set_header Connection 'upgrade';",
      "        proxy_set_header Host \\$host;",
      "        proxy_cache_bypass \\$http_upgrade;",
      "    }",
      "    # API",
      "    location /api/ {",
      "        proxy_pass http://localhost:3000/api/;",
      "        proxy_http_version 1.1;",
      "        proxy_set_header Upgrade \\$http_upgrade;",
      "        proxy_set_header Connection 'upgrade';",
      "        proxy_set_header Host \\$host;",
      "        proxy_cache_bypass \\$http_upgrade;",
      "    }",
      "    # Health check",
      "    location /health {",
      "        proxy_pass http://localhost:3000/health;",
      "        proxy_http_version 1.1;",
      "        proxy_set_header Host \\$host;",
      "        proxy_cache_bypass \\$http_upgrade;",
      "    }",
      "}",
      "EOL",
      "ln -sf /etc/nginx/sites-available/thesaurus /etc/nginx/sites-enabled/",
      "rm -f /etc/nginx/sites-enabled/default",
      "nginx -t && systemctl reload nginx"
    ]
    connection {
      type = "ssh"
      user = "root"
      private_key = file(pathexpand(var.ssh_private_key_path))
      host = hcloud_server.thesaurus.ipv4_address
    }
  }

  # Create .env file
  provisioner "file" {
    source      = "${path.module}/files/.env.generated"
    destination = "/root/.env"
    connection {
      type = "ssh"
      user = "root"
      private_key = file(pathexpand(var.ssh_private_key_path))
      host = hcloud_server.thesaurus.ipv4_address
    }
  }


  # Setup SSL if domain is provided
  provisioner "remote-exec" {
    inline = var.domain != "" ? [
      "apt-get update",
      "apt-get install -y certbot python3-certbot-nginx",
      "certbot --nginx -d ${var.domain} -d www.${var.domain} --non-interactive --agree-tos -m ${var.email} --redirect || echo 'SSL setup failed, continuing anyway'",
      "systemctl reload nginx"
    ] : ["echo 'Skipping SSL setup as no domain was provided'"]

    connection {
      type = "ssh"
      user = "root"
      private_key = file(pathexpand(var.ssh_private_key_path))
      host = hcloud_server.thesaurus.ipv4_address
    }
  }

  # Start services and import data
  provisioner "remote-exec" {
    inline = [
      "cd /root",
      "echo '${var.github_token}' | docker login ghcr.io -u ${var.github_username} --password-stdin",
      "echo 'Starting services...'",
      "docker-compose up -d",
      "echo 'Waiting for services to be ready...'",
      "sleep 60",
      "echo 'Importing WordNet data...'",
      "docker pull ${var.importer_image}",
      "docker run -it --network=host -e MEILI_URL=http://localhost:7700 -e MEILI_KEY=${var.meili_master_key} ${var.importer_image} || echo 'WordNet import failed, but continuing...'"
    ]
    connection {
      type = "ssh"
      user = "root"
      private_key = file(pathexpand(var.ssh_private_key_path))
      host = hcloud_server.thesaurus.ipv4_address
    }
  }
}