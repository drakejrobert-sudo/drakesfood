# Infrastructure

OpenTofu manages the AWS resources needed to serve `drakesfood.com` over HTTPS.

## What This Creates

- S3 bucket for built Angular assets
- Private bucket access restricted to CloudFront
- ACM certificate for `drakesfood.com` and `www.drakesfood.com`
- CloudFront distribution with HTTP-to-HTTPS redirects
- Route 53 alias records for apex and `www`

CloudFront requires ACM certificates to be in `us-east-1`, so this config uses a secondary AWS provider for the certificate while keeping the existing S3 bucket in `us-east-2`.

## One-Time Setup

Install OpenTofu, then initialize from this directory:

```bash
tofu init
```

The `drakesfood.com` S3 bucket already exists. Before applying, import it and the existing bucket access settings into state so OpenTofu adopts them instead of trying to create duplicates:

```bash
tofu import aws_s3_bucket.site drakesfood.com
tofu import aws_s3_bucket_public_access_block.site drakesfood.com
tofu import aws_s3_bucket_policy.site drakesfood.com
```

Then preview and apply:

```bash
tofu plan
tofu apply
```

After apply finishes, get the CloudFront distribution ID:

```bash
tofu output -raw cloudfront_distribution_id
```

Add that value as a GitHub repository variable named `CLOUDFRONT_DISTRIBUTION_ID`.

## GitHub Actions Requirements

The deploy workflow needs these GitHub repository secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

It also needs this GitHub repository variable:

- `CLOUDFRONT_DISTRIBUTION_ID`

The AWS credentials must be allowed to sync files to the S3 bucket and create CloudFront invalidations. Until `CLOUDFRONT_DISTRIBUTION_ID` is configured, the deploy workflow will still sync to S3 but will skip CloudFront invalidation.

## Expected Result

After DNS propagation, these URLs should work:

- `https://drakesfood.com`
- `https://www.drakesfood.com`

Plain HTTP requests should redirect to HTTPS.
