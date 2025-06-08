variable "eks_cluster_name" { 
    type = string 
}

variable "oidc_issuer_url" { 
    type = string 
}

variable "eks_cluster_endpoint" {
     type = string 
}

variable "eks_cluster_certificate_authority" { 
    type = string
}

variable "eks_token" {
     type = string 
}

variable "oidc_provider_arn" {
  type = string
}

variable "tags" {
     type = map(string) 
}
