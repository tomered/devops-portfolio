resource "aws_iam_policy" "eso_secretsmanager" {
  name        = "${var.eks_cluster_name}-eso-secretsmanager"
  policy      = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:ap-south-1:793786247026:secret:tomer-portfolio-env*"
    }
  ]
}
EOF
   tags = merge(
    var.tags,
    {
      Name = "${var.eks_cluster_name}-eso-secretsmanager"
    }
  )
}

resource "aws_iam_role" "eso_irsa" {
  name = "${var.eks_cluster_name}-eso-irsa-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = "sts:AssumeRoleWithWebIdentity",
        Principal = {
          Federated = var.oidc_provider_arn
        },
        Condition = {
          StringEquals = {
            "${replace(var.oidc_issuer_url, "https://", "")}:aud": "sts.amazonaws.com"
          },
          "StringLike": {
            "${replace(var.oidc_issuer_url, "https://", "")}:sub": [
              "system:serviceaccount:portfolio-backend:mongo-secret",
              "system:serviceaccount:mongodb:mongodb-secret",
              "system:serviceaccount:portfolio-backend:redis-secret",
              "system:serviceaccount:portfolio-backend:email-secret",
              "system:serviceaccount:portfolio-backend:model-secret",
            ]
          }
        }
      }
    ]
  })
  tags = merge(
    var.tags,
    {
      Name = "${var.eks_cluster_name}-eso-irsa-role"
    }
  )
}


output "eso_irsa_role_arn" {
  value = aws_iam_role.eso_irsa.arn
  description = "ARN of the ESO IRSA role"
}

resource "aws_iam_role_policy_attachment" "eso_policy_attach" {
  role       = aws_iam_role.eso_irsa.name
  policy_arn = aws_iam_policy.eso_secretsmanager.arn
}