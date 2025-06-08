variable "eks_cluster_name" { 
    type = string 
}

variable "tags" {
     type = map(string) 
}

variable "oidc_provider_arn" {
  type        = string
}

variable "oidc_issuer_url" {
  type        = string
}
