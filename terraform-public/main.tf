provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = module.compute.cluster_endpoint
  cluster_ca_certificate = base64decode(module.compute.eks_cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.token.token
}

provider "helm" {
  kubernetes {
    host                   = module.compute.cluster_endpoint
    cluster_ca_certificate = base64decode(module.compute.eks_cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.token.token
  }
}

provider "kubectl" {
  host                   = module.compute.cluster_endpoint
  cluster_ca_certificate = base64decode(module.compute.eks_cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.token.token
  load_config_file       = false
}

data "aws_eks_cluster_auth" "token" {
  name = var.eks_cluster_name
}

data "tls_certificate" "oidc_thumbprint" {
  url = module.compute.oidc_issuer_url
}

# Single OIDC provider for the cluster
resource "aws_iam_openid_connect_provider" "eks" {
  url             = module.compute.oidc_issuer_url
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.oidc_thumbprint.certificates[0].sha1_fingerprint]
  tags            = var.tags
}

module "network" {
  source = "./modules/network"

  aws_vpc_cidr            = var.aws_vpc_cidr
  aws_vpc_name            = var.aws_vpc_name
  aws_igw_name            = var.aws_igw_name
  aws_rt_name             = var.aws_rt_name
  aws_public_subnet_name  = var.aws_public_subnet_name
  aws_vpc_subnets_cidrs   = var.aws_vpc_subnets_cidrs
  aws_availability_zones  = var.aws_availability_zones
  instance_count          = var.instance_count
  tags                    = var.tags
}

module "compute" {
  source = "./modules/compute"

  eks_cluster_name             = var.eks_cluster_name
  eks_cluster_version          = var.eks_cluster_version
  vpc_id                       = module.network.aws_vpc_id
  subnet_ids                   = module.network.aws_vpc_subnets
  allowed_ingress_ports        = var.allowed_ingress_ports
  eks_instance_type            = var.eks_instance_type
  eks_min_size                 = var.eks_min_size
  eks_max_size                 = var.eks_max_size
  eks_cluster_role_policies    = var.eks_cluster_role_policies
  eks_node_role_policies       = var.eks_node_role_policies
  tags                         = var.tags
}

module "external-secrets" {
  source                   = "./modules/external-secrets"
  eks_cluster_name         = var.eks_cluster_name
  oidc_provider_arn        = aws_iam_openid_connect_provider.eks.arn
  oidc_issuer_url          = module.compute.oidc_issuer_url
  tags                     = var.tags
}

module "ebs_csi_irsa" {
  source = "./modules/ebs-csi"
  
  eks_cluster_name                  = var.eks_cluster_name
  oidc_provider_arn                = aws_iam_openid_connect_provider.eks.arn
  oidc_issuer_url                  = module.compute.oidc_issuer_url
  eks_cluster_endpoint             = module.compute.cluster_endpoint
  eks_cluster_certificate_authority = module.compute.cluster_ca
  eks_token                        = data.aws_eks_cluster_auth.token.token
  tags                            = var.tags
}

module "argocd" {
  source = "./modules/argocd"
  
  gitops_repo_url     = var.gitops_repo_url
  eks_cluster_name    = var.eks_cluster_name
  aws_region          = var.aws_region
  argocd_namespace    = var.argocd_namespace
  infra_path          = var.infra_path
  
  depends_on = [module.compute]
}