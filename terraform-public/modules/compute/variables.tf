variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "eks_cluster_version" {
  description = "EKS Kubernetes version"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "allowed_ingress_ports" {
  type = list(string)
}

variable "subnet_ids" {
  description = "Subnets for the EKS cluster"
  type        = list(string)
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
}

variable "eks_max_size" {
  type    = number
}

variable "tags"{
  type = map(string)
}