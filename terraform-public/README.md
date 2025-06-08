# AWS Infrastructure as Code with Terraform

> A comprehensive Infrastructure as Code (IaC) project using Terraform to provision and manage AWS infrastructure, including networking, compute resources, and Kubernetes add-ons.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Module Documentation](#module-documentation)
- [Contributing](#contributing)
- [Release History](#release-history)
- [Contact](#contact)

## Overview

This project demonstrates Infrastructure as Code (IaC) best practices using Terraform to provision and manage AWS infrastructure. It includes a modular approach to infrastructure management with separate components for networking, compute resources, and Kubernetes add-ons.

Key features:

- Modular Terraform structure for better code organization and reusability
- Complete networking setup with VPC, subnets, and security groups
- EKS cluster provisioning with managed node groups
- Essential Kubernetes add-ons (ArgoCD, External Secrets, EBS CSI Driver)
- Infrastructure state management with remote backend
- Production-ready infrastructure with security best practices

## Architecture

The infrastructure is organized into several key components:

1. **Networking Layer**: VPC, subnets, route tables, and security groups
2. **Compute Layer**: EKS cluster and managed node groups
3. **Kubernetes Add-ons**: 
   - ArgoCD for GitOps
   - External Secrets for secrets management
   - EBS CSI Driver for persistent storage

## Technology Stack

| Category             | Technologies                                           |
| -------------------- | ----------------------------------------------------- |
| **Infrastructure**   | AWS, Terraform                                        |
| **Container Runtime**| Amazon EKS, Docker                                    |
| **Add-ons**         | ArgoCD, External Secrets Operator, EBS CSI Driver     |
| **Version Control**  | Git, Gitlab                                       |
| **Security**        | AWS IAM, RBAC, Security Groups                        |

## Repository Structure

```
terraform/
├── modules/                  # Reusable Terraform modules
│   ├── argocd/              # ArgoCD installation module
│   ├── external-secrets/    # External Secrets Operator module
│   ├── ebs-csi/            # EBS CSI Driver module
│   ├── compute/            # EKS and compute resources
│   └── network/            # VPC and networking components
├── main.tf                  # Main Terraform configuration
├── variables.tf             # Input variables
├── outputs.tf              # Output values
├── versions.tf             # Required providers and versions
├── backend.tf              # Backend configuration
├── prod.tfvars             # Production environment variables
└── .terraform.lock.hcl     # Dependency lock file
```

## Prerequisites

Requirements for deploying this infrastructure:

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0.0
- kubectl (for Kubernetes operations)
- AWS Account with necessary permissions
- Git

## Getting Started

### Infrastructure Setup

1. **Clone the Repository**

```bash
git clone https://gitlab.com/tomer-edelsberg/infrastructure.git
cd terraform
```

2. **Initialize Terraform**

```bash
terraform init
```

3. **Review and Modify Variables**

Review and modify `example.tfvars` according to your requirements.

4. **Plan the Deployment**

```bash
terraform plan -var-file=example.tfvars
```

5. **Apply the Configuration**

```bash
terraform apply -var-file=example.tfvars
```

### Post-Deployment

1. **Configure kubectl**

```bash
aws eks update-kubeconfig --name [CLUSTER_NAME] --region [REGION]
```

2. **Verify Deployment**

```bash
kubectl get nodes
kubectl get pods -A
```

## Module Documentation

### Network Module
- Creates VPC, subnets, route tables, and security groups
- Configures NAT gateways and internet gateway

### Compute Module
- Provisions EKS cluster
- Sets up managed node groups
- Configures cluster IAM roles and policies

### ArgoCD Module
- Installs ArgoCD for GitOps workflows
- Configures initial projects and applications

### External Secrets Module
- Sets up External Secrets Operator
- Configures AWS Secrets Manager integration

### EBS CSI Driver Module
- Installs EBS CSI Driver
- Configures storage classes for persistent volumes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Release History

- 0.1.0
  - Initial release
  - Basic infrastructure setup with EKS support
  - Core modules implementation

## Contact

Tomer Edelsberg  
Email: tomeredel@gmail.com  
LinkedIn: https://www.linkedin.com/in/tomer-edelsberg/

Project Link: https://gitlab.com/tomer-edelsberg/infrastructure.git