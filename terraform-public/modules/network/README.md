# Network Module

This module is responsible for creating the networking infrastructure for the application.

## Resources Created
- VPC
- Internet Gateway
- Public Route Table
- Public Subnets (1 or 2, depending on environment)
- Route Table Associations

## Inputs

| Name | Description | Type |
|:-----|:------------|:-----|
| aws_vpc_cidr | CIDR block for the VPC | `string` |
| aws_vpc_name | Name for the VPC | `string` |
| aws_igw_name | Name for the Internet Gateway | `string` |
| aws_rt_name | Name for the Route Table | `string` |
| aws_public_subnet_name | Name prefix for the Public Subnets | `string` |
| aws_vpc_subnets_cidrs | List of CIDRs for the Public Subnets | `list(string)` |
| instance_count | Number of subnets to create (1 or 2) | `number` |
| tags | Common tags to apply to resources | `map(string)` |

## Outputs

| Name | Description |
|:-----|:------------|
| aws_vpc_id | ID of the created VPC |
| aws_vpc_subnets | List of IDs of the created public subnets |

## Usage Example

```hcl
module "network" {
  source = "./modules/network"

  aws_vpc_cidr           = var.aws_vpc_cidr
  aws_vpc_name           = var.aws_vpc_name
  aws_igw_name           = var.aws_igw_name
  aws_rt_name            = var.aws_rt_name
  aws_public_subnet_name = var.aws_public_subnet_name
  aws_vpc_subnets_cidrs  = var.aws_vpc_subnets_cidrs
  instance_count         = var.instance_count
  tags                   = var.tags
}
