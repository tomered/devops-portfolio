# Region configuration
aws_region = "ap-south-1"  # Change this to your desired AWS region

# Network Variables
aws_vpc_name = "my-vpc"    # Your VPC name
aws_vpc_cidr = "10.0.0.0/16"  # VPC CIDR block

# Subnet configuration
aws_vpc_subnets_cidrs = [
  "10.0.1.0/24",  # First subnet CIDR
  "10.0.2.0/24"   # Second subnet CIDR
]

instance_count = 2  # Number of instances

# Availability Zones - adjust according to your chosen region
aws_availability_zones = [
  "ap-south-1a",
  "ap-south-1b"
]

# Network resource names
aws_igw_name = "my-igw"              # Internet Gateway name
aws_rt_name = "my-route-table"        # Route Table name
aws_public_subnet_name = "public-subnet"  # Public subnet name

# EKS Configuration
eks_cluster_version = "1.32"          # Kubernetes version
eks_cluster_name = "my-eks-cluster"   # EKS cluster name

# EKS IAM Policies - typically these don't need to be changed
eks_cluster_role_policies = [
  "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
]

eks_node_role_policies = [
  "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
  "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
  "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
]

# EKS Node Group Configuration
eks_instance_type = "t3a.medium"  # Instance type for worker nodes
eks_min_size = 2                  # Minimum number of nodes
eks_max_size = 3                  # Maximum number of nodes

# Security Configuration
allowed_ingress_ports = [
  "22",   # SSH
  "10250", # kubelet
  "80",   # HTTP
  "443"   # HTTPS
]

# Resource Tags
tags = {
  owner           = "your.name"
  project         = "my-project"
  environment     = "development"
  expiration_date = "yyyy-mm-dd"
}

# External Secrets Configuration
namespace = "external-secrets"           # Namespace for External Secrets Operator
service_account_name = "external-secrets-sa"  # Service account name

# ArgoCD Configuration
argocd_namespace = "argocd"  # Namespace for ArgoCD

# GitOps Configuration
infra_path = "argocd"        # Path to ArgoCD configurations
gitops_repo_url = "git@gitlab.com:username/gitops.git"  # Your GitOps repository URL 