variable "gitops_repo_url" {
  description = "url for argocd infra"
  type        = string
}


variable "eks_cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "argocd_namespace" {
  description = "namespace for argocd"
  type = string
}

variable "infra_path" {
  description = "The path inside the repository for the infra configuration"
  type = string
}

