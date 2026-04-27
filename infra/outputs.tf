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
