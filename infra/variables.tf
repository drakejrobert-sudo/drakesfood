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

variable "recipe_submissions_api_name" {
  description = "API Gateway HTTP API name for recipe submissions."
  type        = string
  default     = "drakesfood-recipe-submissions"
}

variable "recipe_submissions_allowed_origins" {
  description = "Browser origins allowed to call the recipe submission API."
  type        = list(string)
  default = [
    "https://drakesfood.com",
    "https://www.drakesfood.com",
    "http://localhost:4200",
  ]
}

variable "recipe_submissions_lambda_function_name" {
  description = "Lambda function name for recipe submissions."
  type        = string
  default     = "drakesfood-recipe-submissions"
}

variable "recipe_submissions_log_retention_days" {
  description = "CloudWatch log retention in days for recipe submission resources."
  type        = number
  default     = 30
}

variable "recipe_submissions_ses_identity_arn" {
  description = "Optional SES identity ARN allowed to send recipe submission emails. Defaults to the domain identity for the active AWS account."
  type        = string
  default     = ""
}

variable "recipe_submissions_ses_recipient_email" {
  description = "Email address that receives recipe submission notifications. Set with a tfvars file or CLI variable."
  type        = string
  default     = ""
}

variable "recipe_submissions_ses_sender_email" {
  description = "Verified SES sender email address for recipe submission notifications. Set with a tfvars file or CLI variable."
  type        = string
  default     = ""
}

variable "recipe_submissions_source_site" {
  description = "Source site value stored with accepted recipe submissions."
  type        = string
  default     = "drakesfood.com"
}

variable "recipe_submissions_table_name" {
  description = "DynamoDB table name for recipe submissions."
  type        = string
  default     = "drakesfood-recipe-submissions"
}

variable "recipe_submissions_throttling_burst_limit" {
  description = "API Gateway burst throttling limit for recipe submissions."
  type        = number
  default     = 10
}

variable "recipe_submissions_throttling_rate_limit" {
  description = "API Gateway steady-state requests per second limit for recipe submissions."
  type        = number
  default     = 5
}
