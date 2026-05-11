# Infrastructure

OpenTofu manages the AWS resources needed to serve `drakesfood.com` over HTTPS.

## What This Creates

- S3 bucket for built Angular assets
- Private bucket access restricted to CloudFront
- ACM certificate for `drakesfood.com` and `www.drakesfood.com`
- CloudFront distribution with HTTP-to-HTTPS redirects
- Route 53 alias records for apex and `www`
- IAM user policy for GitHub Actions deployment
- API Gateway HTTP API for recipe submissions
- Lambda function, execution role, and CloudWatch logs for recipe submissions
- DynamoDB table for recipe submission storage
- SES send permissions for recipe submission notifications
- API Gateway HTTP API for blog email subscription signup and confirmation
- Lambda function, execution role, and CloudWatch logs for blog email subscriptions
- DynamoDB table for blog email subscriber storage
- SES send permissions for blog subscription confirmation emails

CloudFront requires ACM certificates to be in `us-east-1`, so this config uses a secondary AWS provider for the certificate while keeping the existing S3 bucket in `us-east-2`.

## Recipe Submissions

The recipe submission backend is defined as low-cost serverless infrastructure:

- API Gateway HTTP API exposes `POST /recipe-submissions`.
- CORS is restricted to `drakesfood.com`, `www.drakesfood.com`, and local Angular development by default.
- Lambda receives the table name, source site, allowed origins, and SES sender/recipient values through environment variables.
- DynamoDB stores accepted submissions by `submissionId`.
- SES sends Drake a plain-text notification after valid submissions are stored.
- CloudWatch log groups use the configured retention period.
- API Gateway throttling defaults to 10 burst requests and 5 sustained requests per second.

The Lambda source lives at `lambda/recipe-submissions/index.mjs`. It validates submissions, stores accepted ideas in DynamoDB, and sends SES notifications when sender and recipient values are configured. It also enforces the configured origin allowlist for browser requests, requires JSON request bodies, rejects oversized request bodies, and handles honeypot submissions without revealing spam detection to bots.

The Lambda request body limit defaults to `16384` bytes and can be adjusted with `recipe_submissions_max_body_bytes` if the text-only V1 form needs more room later. V1 intentionally does not include CAPTCHA; add it only if real abuse requires the extra friction.

See `../docs/recipe-submission-system.md` for the end-to-end recipe submission system documentation, including frontend wiring, API behavior, deployment, testing, and CloudWatch log locations.

## Blog Email Subscriptions

The blog subscription backend is defined as low-cost serverless infrastructure:

- API Gateway HTTP API exposes `POST /blog-subscriptions`, `GET /blog-subscriptions/confirm`, `GET /blog-subscriptions/unsubscribe`, and `POST /blog-subscriptions/unsubscribe`.
- CORS is restricted to `drakesfood.com`, `www.drakesfood.com`, and local Angular development by default.
- Lambda receives the subscriber table name, notification send table name, source site, allowed origins, API base URL, site URL, optional admin alert recipient, and SES sender through environment variables.
- DynamoDB stores subscriber records by `emailHash` so each normalized email has one record, keeps private unsubscribe tokens for notification links, uses lookup indexes for confirmation and unsubscribe token hashes, and tracks notification sends by `postSlug`.
- SES sends plain-text confirmation emails, optional admin alerts, and controlled blog post notification emails. Notification emails include an unsubscribe link.
- Blog notification sending is capped by `blog_notification_max_recipients` for the V1 synchronous sender and runs in small batches to reduce timeout risk.
- CloudWatch log groups use the configured retention period.
- API Gateway throttling defaults to 10 burst requests and 5 sustained requests per second.

The Lambda source lives at `lambda/blog-subscriptions/index.mjs`. It validates signup requests, handles honeypot submissions without storing or emailing them, stores pending subscribers in DynamoDB, sends SES confirmation emails when a sender is configured, activates pending subscribers from confirmation links, optionally emails Drake after successful confirmations or unsubscribes, serves a read-only unsubscribe confirmation page for email links, marks subscribers unsubscribed only after the confirmation page submits a POST request, and sends blog post notifications from an internal GitHub Actions-triggered event.

The Lambda request body limit defaults to `8192` bytes and can be adjusted with `blog_subscriptions_max_body_bytes` if needed.

See `../docs/blog-email-subscriptions.md` for the end-to-end blog subscription documentation, including frontend wiring, API behavior, deployment, testing, privacy notes, and follow-up work.

Before applying blog subscription infrastructure for production, set these values with a local `.tfvars` file or `-var` arguments. The SES identity ARN can be omitted if the verified identity is the site domain in the active AWS account.

```hcl
blog_subscriptions_ses_identity_arn = "arn:aws:ses:us-east-2:<account-id>:identity/drakesfood.com"
blog_subscriptions_ses_sender_email = "Drake's Food <updates@drakesfood.com>"
blog_subscriptions_admin_recipient_email = "drakejrobert@gmail.com"
```

Do not commit real private email addresses or account-specific values unless they are intentionally public. The SES sender identity must be verified before confirmation emails can work. If the SES sender is missing, accepted signups are still stored but confirmation email is skipped and logged. The admin recipient is optional; leave `blog_subscriptions_admin_recipient_email` blank to disable confirm/unsubscribe alerts. If SES is still in sandbox, the admin recipient must also be verified in SES.

After apply, get the API endpoint for frontend configuration:

```bash
AWS_PROFILE=drakesfood tofu output -raw blog_subscriptions_api_endpoint
```

Before applying recipe submission infrastructure for production, set these values with a local `.tfvars` file or `-var` arguments. The SES identity ARN can be omitted if the verified identity is the site domain in the active AWS account.

```hcl
recipe_submissions_ses_identity_arn    = "arn:aws:ses:us-east-2:<account-id>:identity/drakesfood.com"
recipe_submissions_ses_sender_email    = "<verified-sender-email>"
recipe_submissions_ses_recipient_email = "<recipient-email>"
```

Do not commit real email addresses or account-specific values unless they are intentionally public. The SES sender identity must be verified before email notifications can work. If the SES sender or recipient is missing, accepted submissions are still stored but email notification is skipped and logged. If SES fails after storage, the Lambda logs the failure and still returns success to avoid encouraging duplicate submissions.

After apply, get the API endpoint for frontend configuration:

```bash
AWS_PROFILE=drakesfood tofu output -raw recipe_submissions_api_endpoint
```

## One-Time Setup

Install OpenTofu, then initialize from this directory with AWS credentials configured for the account that hosts `drakesfood.com`.

For local infrastructure commands, first verify that the `drakesfood` AWS profile is logged in:

```bash
aws sts get-caller-identity --profile drakesfood
```

If that command fails because the SSO session expired, log in again:

```bash
aws sso login --profile drakesfood
```

Then run OpenTofu commands with the profile selected:

```bash
AWS_PROFILE=drakesfood tofu init
```

The `drakesfood.com` S3 bucket already exists. Before applying, import it and the existing bucket access settings into state so OpenTofu adopts them instead of trying to create duplicates:

```bash
AWS_PROFILE=drakesfood tofu import aws_s3_bucket.site drakesfood.com
AWS_PROFILE=drakesfood tofu import aws_s3_bucket_public_access_block.site drakesfood.com
AWS_PROFILE=drakesfood tofu import aws_s3_bucket_policy.site drakesfood.com
```

The GitHub Actions deploy IAM user already exists. Import it before applying so OpenTofu manages the user and deploy policy without recreating the user:

```bash
AWS_PROFILE=drakesfood tofu import aws_iam_user.github_actions_deploy github-actions-drakesfood-deploy
```

OpenTofu manages the IAM user and its deploy policy only. Do not manage deploy access keys with OpenTofu because secret access key material would be stored in state. Keep the access key ID and secret access key in GitHub repository secrets.

The credentials used for import and apply need permission to read IAM users and create or update IAM user policies. If an inline policy with the same generated name already exists, import it with:

```bash
AWS_PROFILE=drakesfood tofu import aws_iam_user_policy.github_actions_deploy github-actions-drakesfood-deploy:github-actions-drakesfood-deploy-policy
```

Then preview and apply:

```bash
AWS_PROFILE=drakesfood tofu plan
AWS_PROFILE=drakesfood tofu apply
```

After apply finishes, get the CloudFront distribution ID and recipe submission API endpoint:

```bash
AWS_PROFILE=drakesfood tofu output -raw cloudfront_distribution_id
AWS_PROFILE=drakesfood tofu output -raw recipe_submissions_api_endpoint
AWS_PROFILE=drakesfood tofu output -raw blog_subscriptions_api_endpoint
AWS_PROFILE=drakesfood tofu output -raw blog_subscriptions_lambda_function_name
```

Add that value as a GitHub repository variable named `CLOUDFRONT_DISTRIBUTION_ID`.

## GitHub Actions Requirements

The deploy workflow needs these GitHub repository secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

It also needs these GitHub repository variables:

- `CLOUDFRONT_DISTRIBUTION_ID`
- `RECIPE_SUBMISSIONS_API_BASE_URL`
- `BLOG_SUBSCRIPTIONS_API_BASE_URL`
- `BLOG_SUBSCRIPTIONS_LAMBDA_FUNCTION_NAME` optional, defaults to `drakesfood-blog-subscriptions` for the manual notification workflow

Set `RECIPE_SUBMISSIONS_API_BASE_URL` to the `recipe_submissions_api_endpoint` OpenTofu output after the recipe submission infrastructure is applied. The deploy workflow writes this value into `app-config.json` at deploy time. Until it is configured, the public form keeps its not-connected-yet fallback.

Set `BLOG_SUBSCRIPTIONS_API_BASE_URL` to the `blog_subscriptions_api_endpoint` OpenTofu output after the blog subscription infrastructure is applied. Until it is configured, the public signup form keeps its not-connected-yet fallback.

The AWS credentials must be allowed to sync files to the S3 bucket and create CloudFront invalidations. Until `CLOUDFRONT_DISTRIBUTION_ID` is configured, the deploy workflow will still sync to S3 but will skip CloudFront invalidation.

The OpenTofu-managed deploy policy grants the GitHub Actions IAM user these permissions:

- `s3:ListBucket` on the site bucket
- `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` on site bucket objects
- `cloudfront:CreateInvalidation` on the site CloudFront distribution
- `lambda:InvokeFunction` on the blog subscription Lambda for the manual blog notification workflow

If older manually attached deploy policies exist on the IAM user, review and remove them after `tofu apply` confirms the OpenTofu-managed policy is active.

## Expected Result

After DNS propagation, these URLs should work:

- `https://drakesfood.com`
- `https://www.drakesfood.com`

The canonical URL is `https://drakesfood.com/`. The `www` hostname intentionally serves the same site through the same CloudFront distribution for compatibility; canonical metadata and sitemap URLs should continue to use the apex domain.

Plain HTTP requests should redirect to HTTPS. Direct refreshes for Angular routes should return the app with a `200` response because CloudFront maps S3 `403` and `404` responses to `/index.html`.
