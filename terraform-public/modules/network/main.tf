resource "aws_vpc" "app_vpc"{
  cidr_block           = var.aws_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = merge(
    {
      Name = var.aws_vpc_name
    },
    var.tags
  )
}

resource "aws_internet_gateway" "app_igw"{
  vpc_id = aws_vpc.app_vpc.id
  tags = merge(
    {
      Name = var.aws_igw_name
    },
    var.tags
  )
}

resource "aws_route_table" "public_rt"{
  vpc_id = aws_vpc.app_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.app_igw.id
  }
  tags = merge(
    {
      Name = var.aws_rt_name
    },
    var.tags
  )
}

resource "aws_subnet" "public"{
  count = var.instance_count
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = var.aws_vpc_subnets_cidrs[count.index]
  availability_zone       = var.aws_availability_zones[count.index]
  map_public_ip_on_launch = true
  tags = merge(
    {
      Name = "${var.aws_public_subnet_name}-${count.index}"
    },
    var.tags
  )
}
resource "aws_route_table_association" "public_assoc"{
  count = var.instance_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public_rt.id
}