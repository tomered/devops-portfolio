output "aws_vpc_id" {
  value = aws_vpc.app_vpc.id
}

output "aws_vpc_subnets" {
  value = aws_subnet.public[*].id
}