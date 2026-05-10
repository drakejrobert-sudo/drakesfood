output "s3_bucket_name" {
  description = "S3 bucket used for static site assets."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for GitHub Actions cache invalidation."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "Generated CloudFront distribution hostname."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "certificate_arn" {
  description = "ACM certificate ARN used by CloudFront."
  value       = aws_acm_certificate.site.arn
}

output "recipe_submissions_api_endpoint" {
  description = "Base endpoint URL for the recipe submission HTTP API."
  value       = aws_apigatewayv2_api.recipe_submissions.api_endpoint
}

output "recipe_submissions_table_name" {
  description = "DynamoDB table used for accepted recipe submissions."
  value       = aws_dynamodb_table.recipe_submissions.name
}

output "recipe_submissions_lambda_function_name" {
  description = "Lambda function that handles recipe submissions."
  value       = aws_lambda_function.recipe_submissions.function_name
}

output "blog_subscriptions_api_endpoint" {
  description = "Base endpoint URL for the blog subscription HTTP API."
  value       = aws_apigatewayv2_api.blog_subscriptions.api_endpoint
}

output "blog_subscriptions_table_name" {
  description = "DynamoDB table used for blog email subscribers."
  value       = aws_dynamodb_table.blog_subscribers.name
}

output "blog_subscriptions_lambda_function_name" {
  description = "Lambda function that handles blog email subscriptions."
  value       = aws_lambda_function.blog_subscriptions.function_name
}

output "blog_notification_sends_table_name" {
  description = "DynamoDB table used for blog post notification send tracking."
  value       = aws_dynamodb_table.blog_notification_sends.name
}
