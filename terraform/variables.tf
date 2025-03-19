variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment to deploy (production or staging)"
  type        = string
  default     = "production"

  validation {
    condition = contains(["production", "staging"], var.environment)
    error_message = "Environment must be 'production' or 'staging'."
  }
}

variable "server_name" {
  description = "Name of the server"
  type        = string
  default     = "thesaurus"
}

variable "region" {
  description = "Hetzner Cloud region"
  type        = string
  default     = "fsn1" # Falkenstein, Germany
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "cax21" # ARM-based Ampere instance with 2 vCPUs, 4 GB RAM
}

variable "os_type" {
  description = "Operating system"
  type        = string
  default     = "ubuntu-22.04"
}

variable "volume_size" {
  description = "Size of the data volume in GB"
  type        = number
  default     = 50
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "ssh_private_key_path" {
  description = "Path to SSH private key"
  type        = string
  default     = "~/.ssh/id_rsa"
}

variable "jwt_secret" {
  description = "JWT Secret Key"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "JWT token expiration time in minutes"
  type        = number
  default     = 60
}

variable "jwt_maxage" {
  description = "JWT cookie max age in minutes"
  type        = number
  default     = 60
}

variable "meili_master_key" {
  description = "MeiliSearch Master Key"
  type        = string
  sensitive   = true
}

variable "postgres_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "postgres"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "postgres_db" {
  description = "PostgreSQL database name"
  type        = string
  default     = "thesaurus"
}

variable "api_image" {
  description = "Docker image for the API"
  type        = string
  default     = "ghcr.io/user/thesaurus-api:latest"
}

variable "frontend_image" {
  description = "Docker image for the Frontend"
  type        = string
  default     = "ghcr.io/user/thesaurus-frontend:latest"
}

variable "importer_image" {
  description = "Docker image for the WordNet importer"
  type        = string
  default     = "ghcr.io/user/wordnet-importer:latest"
}

variable "domain" {
  description = "Domain name for the application (optional)"
  type        = string
  default = "freesaurus.net"
}

variable "email" {
  description = "Email address for SSL certificate notifications"
  type        = string
  default = "callumjamesteesdale@gmail.com"
}

variable "github_username" {
  description = "GitHub username for container registry access"
  type        = string
  default     = "callumteesdale"
}

variable "github_token" {
  description = "GitHub personal access token for container registry access"
  type        = string
  sensitive   = true
}

variable "wordnet_dump_path" {
  description = "Path to the WordNet dump file (local)"
  type        = string
  default = "../wordnet.dump"
}

variable "import_dump" {
  description = "Whether to import the WordNet dump during deployment"
  type        = bool
  default = true
}