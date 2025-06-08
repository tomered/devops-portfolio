variable "aws_region" {
  type        = string
}

// Network

// VPC
variable "aws_vpc_name"{
    type = string
}

variable "aws_vpc_cidr"{
  type = string
}

variable "aws_vpc_subnets_cidrs"{
  type = list(string)
}

variable aws_availability_zones{
  type = list(string)
}

variable "instance_count"{
  type = number
}


// IGW
variable "aws_igw_name"{
  type = string
}


// RT
variable "aws_rt_name"{
  type = string
}


// Subnet
variable "aws_public_subnet_name"{
  type = string
}


// Tags
variable "tags"{
  type = map(string)
}



// Compute

variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "eks_cluster_version" {
  description = "EKS Kubernetes version"
  type        = string
}

variable "allowed_ingress_ports" {
  type = list(string)
}


variable "eks_cluster_role_policies" {
  description = "Policies to attach to the cluster role"
  type        = list(string)
}

variable "eks_node_role_policies" {
  description = "Policies to attach to the node role"
  type        = list(string)
}

variable "eks_instance_type" {
  type        = string
}

variable "eks_min_size" {
  type    = number
  default = 2
}

variable "eks_max_size" {
  type    = number
  default = 3
}


// eks-irsa-external-secrets
variable "namespace" {
  description = "Namespace for External Secrets Operator"
  type        = string
}

variable "service_account_name" {
  description = "Service account name for ESO"
  type        = string
  default     = "external-secrets-sa"
}

variable "external_secrets_config" {
  description = "Configuration for external-secrets"
  type = object({
    name       = string
    namespace  = string
    chart      = string
    repository = string
    version    = string
  })
  default = {
    name       = "external-secrets"
    namespace  = "external-secrets"
    chart      = "external-secrets"
    repository = "https://charts.external-secrets.io"
    version    = "0.9.9"
  }
}


// argocd

variable "argocd_namespace" {
  description = "namespace for argocd"
  type = string
}

variable "infra_path" {
  description = "The path inside the repository for the infra configuration"
  type = string
}

variable "gitops_repo_url" {
  description = "url for argocd infra"
  type        = string
}