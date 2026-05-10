# Blog Email Subscriptions

This document explains the V1 blog email subscription system for `drakesfood.com`. The feature lets readers request email notifications for new Drake's Food blog posts.

V1 is intentionally small:

- Readers submit only an email address.
- Readers must confirm before becoming active subscribers.
- Readers can unsubscribe from notification emails without creating an account.
- Subscriber emails are private operational data.
- New-post notification sending is tracked separately in #84.

## Frontend

The Angular signup form lives in:

- `src/app/components/blog-subscription/blog-subscription.component.ts`
- `src/app/components/blog-subscription/blog-subscription.component.html`
- `src/app/components/blog-subscription/blog-subscription.component.css`

The component is rendered inside the blog section from `src/app/components/recipe-blog/recipe-blog.component.html`.

The frontend posts through `src/app/services/blog-subscription-api.service.ts`. It reads the API base URL from `AppConfigService`, which fetches `/app-config.json` at runtime. Local development starts with `public/app-config.json` configured as:

```json
{
  "recipeSubmissionsApiBaseUrl": "",
  "blogSubscriptionsApiBaseUrl": ""
}
```

When the value is blank, the form stays visible but reports that email updates are not connected yet. In production, GitHub Actions writes `dist/drakesfood-app/browser/app-config.json` using the repository variable `BLOG_SUBSCRIPTIONS_API_BASE_URL`.

## API

Signup endpoint:

```http
POST /blog-subscriptions
Content-Type: application/json
```

Request body:

```json
{
  "email": "reader@example.com",
  "website": ""
}
```

The `website` field is a honeypot. Valid readers should leave it blank.

Success response:

```json
{
  "success": true,
  "message": "If that email can be subscribed, a confirmation link is on the way."
}
```

The success response is intentionally generic so the API does not reveal whether an email is already subscribed.

Confirmation endpoint:

```http
GET /blog-subscriptions/confirm?token=<confirmation-token>
```

Valid confirmation tokens activate the pending subscriber and redirect to `/blog?subscription=confirmed`. Invalid or expired tokens redirect to `/blog?subscription=invalid`.

Unsubscribe endpoint:

```http
GET /blog-subscriptions/unsubscribe?token=<unsubscribe-token>
```

Valid unsubscribe tokens mark the subscriber as `unsubscribed` and redirect to `/blog?subscription=unsubscribed`. Repeated unsubscribe requests are treated as success. Invalid tokens redirect to `/blog?subscription=invalid`.

## Backend Resources

Blog subscription infrastructure is defined in `infra/blog_subscriptions.tf`.

The V1 architecture uses:

- API Gateway HTTP API for `POST /blog-subscriptions`, `GET /blog-subscriptions/confirm`, and `GET /blog-subscriptions/unsubscribe`.
- Lambda for validation, honeypot handling, DynamoDB writes, SES confirmation emails, confirmation activation, and unsubscribe handling.
- DynamoDB for subscriber records.
- SES for confirmation emails.
- CloudWatch Logs for API Gateway access logs and Lambda logs.
- OpenTofu for resource management.

## DynamoDB

The DynamoDB table is created by `aws_dynamodb_table.blog_subscribers`.

Default table name: `drakesfood-blog-subscribers`

The table uses pay-per-request billing and is keyed by `emailHash` so each normalized email can have only one subscriber record. It includes GSIs for `confirmationTokenHash` and `unsubscribeTokenHash` lookups.

Subscriber item shape:

```json
{
  "subscriberId": "uuid",
  "emailNormalized": "reader@example.com",
  "emailHash": "sha256 hash",
  "status": "pending",
  "createdAt": "2026-05-09T12:00:00.000Z",
  "updatedAt": "2026-05-09T12:00:00.000Z",
  "confirmedAt": "2026-05-09T12:05:00.000Z",
  "confirmationTokenHash": "sha256 hash",
  "unsubscribeToken": "random token for notification email links",
  "unsubscribeTokenHash": "sha256 hash",
  "source": "drakesfood.com"
}
```

`subscriberId` is a stored identifier for logging and debugging, not the table key. `confirmedAt` appears after confirmation. `unsubscribedAt` appears after unsubscribe. `confirmationTokenHash` is removed after successful confirmation or unsubscribe. `unsubscribeToken` is retained so #84 can build deliverable unsubscribe links in notification emails, while `unsubscribeTokenHash` is retained so unsubscribe requests can be looked up without querying by the raw token.

## Privacy

Subscriber email addresses are private data.

- Do not commit subscriber exports.
- Do not add subscriber emails to GitHub issues, logs, screenshots, or docs.
- Prefer logging `subscriberId` and error names instead of raw email addresses or tokens.
- Confirmation tokens are stored only as SHA-256 hashes.
- Unsubscribe tokens are private bearer-token data. Store them only in DynamoDB, use them only for notification email links, and do not log them.
- Every future notification email must include the subscriber's unsubscribe link.

## SES

SES sends confirmation emails from the configured sender.

Before production confirmations can work:

- Verify `drakesfood.com` as an SES sending identity, or provide a specific verified identity ARN.
- If the AWS account is still in the SES sandbox, verified recipient limitations will apply.
- Set `blog_subscriptions_ses_sender_email` through a local `.tfvars` file or `-var` argument.
- Set `blog_subscriptions_ses_identity_arn` only if the sending identity is not the default `drakesfood.com` domain identity in the active AWS account.

Recommended sender:

```txt
Drake's Food <updates@drakesfood.com>
```

A real mailbox for `updates@drakesfood.com` is not required for V1 sending, but forwarding is recommended later if reader replies should land somewhere useful.

## OpenTofu Deployment

Useful variables for this feature are defined in `infra/variables.tf`:

- `blog_subscriptions_api_name`
- `blog_subscriptions_allowed_origins`
- `blog_subscriptions_lambda_function_name`
- `blog_subscriptions_log_retention_days`
- `blog_subscriptions_max_body_bytes`
- `blog_subscriptions_ses_identity_arn`
- `blog_subscriptions_ses_sender_email`
- `blog_subscriptions_source_site`
- `blog_subscriptions_table_name`
- `blog_subscriptions_throttling_burst_limit`
- `blog_subscriptions_throttling_rate_limit`

Preview and apply from `infra/` with the AWS profile selected:

```bash
AWS_PROFILE=drakesfood tofu plan
AWS_PROFILE=drakesfood tofu apply
```

After apply, get the values needed for frontend configuration and operational checks:

```bash
AWS_PROFILE=drakesfood tofu output -raw blog_subscriptions_api_endpoint
AWS_PROFILE=drakesfood tofu output -raw blog_subscriptions_table_name
AWS_PROFILE=drakesfood tofu output -raw blog_subscriptions_lambda_function_name
```

## GitHub Actions Deployment

The static site deploy workflow is `.github/workflows/deploy.yml`. It runs on pushes to `main`.

Required GitHub repository variable:

- `BLOG_SUBSCRIPTIONS_API_BASE_URL`: set to the OpenTofu output `blog_subscriptions_api_endpoint`.

Related deployment requirements:

- `AWS_ACCESS_KEY_ID` repository secret
- `AWS_SECRET_ACCESS_KEY` repository secret
- `CLOUDFRONT_DISTRIBUTION_ID` repository variable for cache invalidation

If `BLOG_SUBSCRIPTIONS_API_BASE_URL` is missing or blank, production will deploy successfully but the public signup form will use its not-connected-yet fallback.

## Local Testing

Run the standard app checks from the repository root:

```bash
npm run lint
npm run typecheck
npm run build
```

Run the Lambda tests:

```bash
node --test infra/lambda/blog-subscriptions/index.test.mjs
```

## Follow-Up Work

- #84 sends new-post notifications to active subscribers.
- #85 expands operating documentation after the full notification flow exists.
