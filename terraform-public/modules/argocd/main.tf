terraform {
  required_providers {
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = "~> 1.14.0"
    }
  }
}

resource "helm_release" "argocd" {
  name       = var.argocd_namespace
  namespace  = var.argocd_namespace
  create_namespace = true
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "8.0.10"
  values = []
}

# Data source to fetch the SSH key from AWS Secrets Manager
data "aws_secretsmanager_secret" "argocd_ssh_key" {
  name = "tomer-gitlab-ssh"
}
data "aws_secretsmanager_secret_version" "argocd_ssh_key" {
  secret_id = data.aws_secretsmanager_secret.argocd_ssh_key.id
}
# Create Kubernetes secret for ArgoCD repository
resource "kubernetes_secret" "argocd_repo_ssh" {
  metadata {
    name      = "repo-gitlab-ssh"
    namespace = var.argocd_namespace
    labels = {
      "argocd.argoproj.io/secret-type" = "repository"
    }
  }
  data = {
    type          = "git"
    url           = var.gitops_repo_url
    sshPrivateKey = jsondecode(data.aws_secretsmanager_secret_version.argocd_ssh_key.secret_string)["gitlab_repo_ssh"]
  }
  type = "Opaque"
  depends_on = [helm_release.argocd]
}

# Create Kubernetes manifest for ArgoCD root application
resource "kubectl_manifest" "argocd_application_infra_app" {
  yaml_body = templatefile("${path.module}/templates/root_app.yaml", {
    name = "root-app"
    namespace       = var.argocd_namespace
    repo_url        = var.gitops_repo_url
    infra_namespace = var.argocd_namespace
    infra_path      = var.infra_path
  })
  depends_on = [helm_release.argocd]
}

resource "kubernetes_namespace" "namespaces" {
  for_each = toset([
    "portfolio-backend",
    "portfolio-ui",
    "mongodb",
  ])
  metadata {
    name = each.value
  }
}