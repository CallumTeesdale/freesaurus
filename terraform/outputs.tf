output "server_ip" {
  description = "Public IP address of the server"
  value       = hcloud_server.thesaurus.ipv4_address
}

output "server_status" {
  description = "Status of the server"
  value       = hcloud_server.thesaurus.status
}

output "volume_id" {
  description = "ID of the data volume"
  value       = hcloud_volume.thesaurus_data.id
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh root@${hcloud_server.thesaurus.ipv4_address}"
}

output "api_url" {
  description = "URL of the Thesaurus API"
  value       = var.domain != "" ? "https://${var.domain}/api" : "http://${hcloud_server.thesaurus.ipv4_address}/api"
}

output "app_url" {
  description = "URL of the Thesaurus Web Application"
  value       = var.domain != "" ? "https://${var.domain}" : "http://${hcloud_server.thesaurus.ipv4_address}"
}

output "meilisearch_url" {
  description = "MeiliSearch URL (for admin access)"
  value       = "http://${hcloud_server.thesaurus.ipv4_address}:7700"
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}