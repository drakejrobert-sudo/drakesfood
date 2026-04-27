variable "aws_region" {
  description = "Primary AWS region for the S3 bucket and Route 53 resources."
  type        = string
  default     = "us-east-2"
}

variable "domain_name" {
  description = "Apex domain for the website."
  type        = string
  default     = "drakesfood.com"
}

variable "www_domain_name" {
  description = "www hostname for the website."
  type        = string
  default     = "www.drakesfood.com"
}

variable "s3_bucket_name" {
  description = "S3 bucket that stores the built static site assets."
  type        = string
  default     = "drakesfood.com"
}

variable "github_actions_deploy_user_name" {
  description = "IAM user used by GitHub Actions to deploy the static site. Access keys are managed outside OpenTofu."
  type        = string
  default     = "github-actions-drakesfood-deploy"
}
