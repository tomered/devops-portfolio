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

variable "instance_count"{
  type = number
}

variable aws_availability_zones{
  type = list(string)
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
