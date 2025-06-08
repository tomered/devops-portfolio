resource "aws_iam_role" "cluster_role" {
  name               = "${var.eks_cluster_name}-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "eks.amazonaws.com" },
      Action   = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "cluster_role_attachments" {
  for_each   = toset(var.eks_cluster_role_policies)
  role       = aws_iam_role.cluster_role.name
  policy_arn = each.value
}

resource "aws_security_group" "eks" {
  name   = "${var.eks_cluster_name}-eks-sg"
  vpc_id = var.vpc_id
  tags   = var.tags
}

resource "aws_security_group_rule" "eks_ingress" {
  for_each = toset(var.allowed_ingress_ports)

  type              = "ingress"
  from_port         = each.value
  to_port           = each.value
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.eks.id
}

resource "aws_security_group_rule" "eks_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.eks.id
}

resource "aws_eks_cluster" "this" {
  name     = var.eks_cluster_name
  role_arn = aws_iam_role.cluster_role.arn
  version  = var.eks_cluster_version

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.eks.id]
  }

  tags = var.tags

  depends_on = [aws_iam_role_policy_attachment.cluster_role_attachments]
}

resource "aws_iam_role" "node_role" {
  name               = "${var.eks_cluster_name}-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
      Action   = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "node_role_attachments" {
  for_each   = toset(var.eks_node_role_policies)
  role       = aws_iam_role.node_role.name
  policy_arn = each.value
}

resource "aws_eks_node_group" "default" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.eks_cluster_name}-ng"
  node_role_arn   = aws_iam_role.node_role.arn
  subnet_ids      = var.subnet_ids

  scaling_config {
    desired_size = var.eks_min_size
    min_size     = var.eks_min_size
    max_size     = var.eks_max_size
  }

  instance_types = [var.eks_instance_type]

  tags = var.tags

  depends_on = [aws_iam_role_policy_attachment.node_role_attachments]
}