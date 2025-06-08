terraform {
  backend "s3" {
    bucket = "tomer-terraform-1"
    key    = "do-it-right/terraform.tfstate"
    region = "ap-south-1"
  }
}