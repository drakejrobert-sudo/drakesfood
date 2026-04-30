# Recipe Submission System

This document explains the V1 recipe submission system for `drakesfood.com`. The feature lets visitors submit recipe ideas, links, and notes for Drake to review manually.

V1 is intentionally small:

- Submissions are text and links only.
- Submissions are stored for manual review.
- Nothing submitted by users auto-publishes to the website.
- File and image uploads are out of scope.

Future image uploads may be considered later with S3 presigned URLs, but they are not part of V1.

## Frontend

The Angular form lives in:

- `src/app/components/recipe-submission/recipe-submission.component.ts`
- `src/app/components/recipe-submission/recipe-submission.component.html`
- `src/app/components/recipe-submission/recipe-submission.component.css`

The form is rendered on the homepage from `src/app/app.html` with `<app-recipe-submission></app-recipe-submission>`.

The frontend posts through `src/app/services/recipe-submission-api.service.ts`. It reads the API base URL from `AppConfigService`, which fetches `/app-config.json` at runtime. Local development starts with `public/app-config.json` configured as:

```json
{
  "recipeSubmissionsApiBaseUrl": ""
}
```

When the value is blank, the form stays visible but reports that online recipe submissions are not connected yet. In production, GitHub Actions writes `dist/drakesfood-app/browser/app-config.json` using the repository variable `RECIPE_SUBMISSIONS_API_BASE_URL`.

## API

The public endpoint is:

```http
POST /recipe-submissions
Content-Type: application/json
```

The production base URL comes from the OpenTofu output `recipe_submissions_api_endpoint`. The Angular client sends requests to `${recipeSubmissionsApiBaseUrl}/recipe-submissions`.

Request body:

```json
{
  "title": "Smoked birria tacos",
  "description": "Would love to see this cooked on the Masterbuilt Gravity Series 800.",
  "name": "Jane",
  "email": "jane@example.com",
  "recipeUrl": "https://example.com/recipe",
  "socialUrl": "https://instagram.com/example",
  "permissionToCredit": true,
  "website": ""
}
```

Success response:

```json
{
  "success": true,
  "message": "Thanks! Your idea was sent to Drake."
}
```

Validation error response:

```json
{
  "success": false,
  "message": "Please include a recipe title and description."
}
```

See `docs/recipe-submission-api.md` for the detailed API contract, field limits, status codes, honeypot behavior, and DynamoDB item shape.

## Backend Resources

Recipe submission infrastructure is defined in `infra/recipe_submissions.tf`.

The V1 architecture uses:

- API Gateway HTTP API for `POST /recipe-submissions`
- Lambda for validation, spam-honeypot handling, DynamoDB writes, and SES notification attempts
- DynamoDB for accepted submission storage
- SES for plain-text email notifications
- CloudWatch Logs for API Gateway access logs and Lambda logs
- OpenTofu for resource management

## DynamoDB

The DynamoDB table is created by `aws_dynamodb_table.recipe_submissions`.

Default table name: `drakesfood-recipe-submissions`

The table uses pay-per-request billing and is keyed by `submissionId`. Accepted non-honeypot submissions are stored as one item with these attributes:

```json
{
  "submissionId": "uuid",
  "submittedAt": "2026-04-30T14:30:00.000Z",
  "status": "new",
  "title": "Smoked birria tacos",
  "description": "Would love to see this cooked on the Masterbuilt Gravity Series 800.",
  "name": "Jane",
  "email": "jane@example.com",
  "recipeUrl": "https://example.com/recipe",
  "socialUrl": "https://instagram.com/example",
  "permissionToCredit": true,
  "source": "drakesfood.com"
}
```

Required item attributes are `submissionId`, `submittedAt`, `status`, `title`, `description`, `permissionToCredit`, and `source`. Optional empty string fields are omitted by the Lambda handler.

## Lambda

The Lambda source lives at `infra/lambda/recipe-submissions/index.mjs`.

Default function name: `drakesfood-recipe-submissions`

The handler:

- Accepts only `POST` requests.
- Checks the request `Origin` header against the configured allowlist when present.
- Requires JSON request bodies when a `Content-Type` header is present.
- Rejects oversized request bodies before JSON parsing.
- Normalizes and validates submitted fields server-side.
- Treats populated `website` honeypot submissions as successful spam-filtered responses without storing or emailing them.
- Stores accepted submissions in DynamoDB.
- Attempts to send a plain-text SES notification after storage.
- Returns success even if SES notification fails after storage, so users do not retry and create duplicates.

Key Lambda environment variables:

| Variable | Purpose | Production source | Local/testing value |
| --- | --- | --- | --- |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed by Lambda origin checks. | `recipe_submissions_allowed_origins` OpenTofu variable. | Include `http://localhost:4200` when testing from Angular dev server. |
| `RECIPE_SUBMISSIONS_MAX_BODY_BYTES` | Maximum raw request body size before JSON parsing. | `recipe_submissions_max_body_bytes`, default `16384`. | Use default unless testing body-limit behavior. |
| `RECIPE_SUBMISSIONS_TABLE_NAME` | DynamoDB table name for accepted submissions. | Created table name from OpenTofu. | Test table name or mocked dependency in Lambda tests. |
| `RECIPE_SUBMISSIONS_SOURCE_SITE` | Source value stored on DynamoDB items. | `recipe_submissions_source_site`, default `drakesfood.com`. | `local` or `drakesfood.com`. |
| `SES_RECIPIENT_EMAIL` | Email address that receives notifications. | `recipe_submissions_ses_recipient_email`. | Blank to skip email, or verified sandbox recipient. |
| `SES_SENDER_EMAIL` | Verified SES sender address. | `recipe_submissions_ses_sender_email`. | Blank to skip email, or verified sandbox sender. |

## SES

SES is used only for notification email after a valid submission has already been stored.

Before production notifications can work:

- Verify the sender email address or domain in SES.
- If the AWS account is still in the SES sandbox, verify the recipient email address too.
- Set `recipe_submissions_ses_sender_email` and `recipe_submissions_ses_recipient_email` through a local `.tfvars` file or `-var` arguments.
- Set `recipe_submissions_ses_identity_arn` only if the sending identity is not the default `drakesfood.com` domain identity in the active AWS account.

If `SES_SENDER_EMAIL` or `SES_RECIPIENT_EMAIL` is blank, accepted submissions are still stored and the Lambda logs that notification was skipped. If SES fails after storage, the Lambda logs the error and still returns success.

Do not commit real private email addresses, AWS account IDs, access keys, or SES credentials.

## OpenTofu Deployment

OpenTofu configuration lives in `infra/`.

Useful variables for this feature are defined in `infra/variables.tf`:

- `recipe_submissions_api_name`
- `recipe_submissions_allowed_origins`
- `recipe_submissions_lambda_function_name`
- `recipe_submissions_log_retention_days`
- `recipe_submissions_max_body_bytes`
- `recipe_submissions_ses_identity_arn`
- `recipe_submissions_ses_recipient_email`
- `recipe_submissions_ses_sender_email`
- `recipe_submissions_source_site`
- `recipe_submissions_table_name`
- `recipe_submissions_throttling_burst_limit`
- `recipe_submissions_throttling_rate_limit`

Preview and apply from `infra/` with the AWS profile selected:

```bash
AWS_PROFILE=drakesfood tofu plan
AWS_PROFILE=drakesfood tofu apply
```

After apply, get the values needed for frontend configuration and operational checks:

```bash
AWS_PROFILE=drakesfood tofu output -raw recipe_submissions_api_endpoint
AWS_PROFILE=drakesfood tofu output -raw recipe_submissions_table_name
AWS_PROFILE=drakesfood tofu output -raw recipe_submissions_lambda_function_name
```

See `infra/README.md` for the full infrastructure setup, imports, deploy IAM policy, and GitHub Actions requirements.

## GitHub Actions Deployment

The static site deploy workflow is `.github/workflows/deploy.yml`. It runs on pushes to `main`.

For recipe submissions, the workflow reads the repository variable `RECIPE_SUBMISSIONS_API_BASE_URL` and writes it into the built app's runtime `app-config.json` before syncing to S3.

Required GitHub repository variable:

- `RECIPE_SUBMISSIONS_API_BASE_URL`: set to the OpenTofu output `recipe_submissions_api_endpoint`.

Related deployment requirements:

- `AWS_ACCESS_KEY_ID` repository secret
- `AWS_SECRET_ACCESS_KEY` repository secret
- `CLOUDFRONT_DISTRIBUTION_ID` repository variable for cache invalidation

If `RECIPE_SUBMISSIONS_API_BASE_URL` is missing or blank, production will deploy successfully but the public form will use its not-connected-yet fallback.

## Local Testing

Run the standard app checks from the repository root:

```bash
npm run lint
npm run typecheck
npm run build
```

Run Lambda unit tests directly with Node:

```bash
node --test infra/lambda/recipe-submissions/index.test.mjs
```

To test the Angular form locally against a deployed API:

1. Set `public/app-config.json` to the deployed API base URL from `tofu output -raw recipe_submissions_api_endpoint`.
2. Confirm `http://localhost:4200` is included in `recipe_submissions_allowed_origins` before applying infrastructure.
3. Run `npm start`.
4. Open `http://localhost:4200`.
5. Submit a valid recipe idea from the form.
6. Confirm the UI shows `Thanks! Your idea was sent to Drake.`
7. Confirm a new item appears in the DynamoDB table.
8. Confirm an SES notification arrives if sender and recipient values are configured and verified.

Do not commit local API endpoint changes to `public/app-config.json` unless the value is intentionally safe and public.

## Production Smoke Testing

After infrastructure and site deployment:

1. Open `https://drakesfood.com`.
2. Fill out the recipe submission form with a short test idea.
3. Submit the form and confirm the success message appears.
4. Check DynamoDB for a new item with `status` set to `new`.
5. Check the notification recipient inbox if SES is configured.
6. Check Lambda logs for unexpected validation, DynamoDB, or SES errors.
7. Check API Gateway access logs for successful `POST /recipe-submissions` requests.

Use an obvious test title so the record can be identified later. Do not submit sensitive personal data while smoke testing.

## CloudWatch Logs

OpenTofu creates separate CloudWatch log groups for Lambda and API Gateway.

Default Lambda log group:

```text
/aws/lambda/drakesfood-recipe-submissions
```

Default API Gateway access log group:

```text
/aws/apigateway/drakesfood-recipe-submissions
```

The retention period is controlled by `recipe_submissions_log_retention_days`, which defaults to `30`.

Lambda logs include spam-filter notices, DynamoDB save failures, skipped SES notifications, and SES send failures. API Gateway logs include request ID, method, route key, status, and response length.

## Out Of Scope

V1 does not include:

- Auto-publishing submitted recipes or ideas.
- File or image uploads.
- S3 presigned upload URLs.
- Recipe moderation UI.
- User accounts.
- CAPTCHA, unless real abuse requires it later.
- A full operational runbook for every AWS failure mode.
