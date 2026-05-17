# Blog Email Subscriptions

This document explains the V1 blog email subscription system for `drakesfood.com`. The feature lets readers request email notifications for new Drake's Food blog posts.

Use this as the operating runbook for setup, testing, notification sends, troubleshooting, and privacy handling.

V1 is intentionally small:

- Readers submit only an email address.
- Readers must confirm before becoming active subscribers.
- Readers can unsubscribe from notification emails without creating an account.
- New-post notifications are sent by a manual GitHub Actions workflow with a dry-run mode.
- Subscriber emails are private operational data.

## Operating Checklist

Before accepting public subscribers or sending real notification emails:

- Verify the SES sending identity for `drakesfood.com` or the configured sender address.
- Confirm SES production access, or understand sandbox limits if still in sandbox.
- Set `blog_subscriptions_ses_sender_email` locally for OpenTofu, for example `Drake's Food <updates@drakesfood.com>`.
- Optionally set `blog_subscriptions_admin_recipient_email = "drakejrobert@gmail.com"` locally for admin alerts when readers confirm or unsubscribe.
- Run `AWS_PROFILE=drakesfood tofu plan` from `infra/` and review the planned blog subscription resources.
- Run `AWS_PROFILE=drakesfood tofu apply` only after the plan looks correct.
- Set GitHub repository variable `BLOG_SUBSCRIPTIONS_API_BASE_URL` from `tofu output -raw blog_subscriptions_api_endpoint`.
- Optionally set GitHub repository variable `BLOG_SUBSCRIPTIONS_LAMBDA_FUNCTION_NAME` from `tofu output -raw blog_subscriptions_lambda_function_name`; the workflow defaults to `drakesfood-blog-subscriptions` if blank.
- Let the normal deploy workflow publish the updated `app-config.json`.
- Smoke-test signup, confirmation, and unsubscribe before any real notification send.
- Run `Send Blog Notification` with `dry_run: true` and review the output.
- Run `Send Blog Notification` with `dry_run: false` only after the dry run looks correct.

Do not run the real send workflow before unsubscribe has been smoke-tested in production.

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
  "message": "If that email can be subscribed, a confirmation link is on the way. Check your junk or spam folder if you do not see it soon."
}
```

The success response is intentionally generic so the API does not reveal whether an email is already subscribed.

Confirmation endpoint:

```http
GET /blog-subscriptions/confirm?token=<confirmation-token>
```

Valid confirmation tokens activate the pending subscriber and redirect to `/blog?subscription=confirmed`. Invalid or expired tokens redirect to `/blog?subscription=invalid`.

Unsubscribe confirmation endpoint:

```http
GET /blog-subscriptions/unsubscribe?token=<unsubscribe-token>
```

Valid unsubscribe tokens return a confirmation page and do not change subscriber state. This keeps email security scanners and link preview clients from unsubscribing readers automatically. Invalid tokens redirect to `/blog?subscription=invalid`.

Unsubscribe mutation endpoint:

```http
POST /blog-subscriptions/unsubscribe?token=<unsubscribe-token>
```

Browser form POSTs from the confirmation page mark the subscriber as `unsubscribed` and redirect to `/blog?subscription=unsubscribed`. Repeated unsubscribe requests are treated as success. Invalid browser form tokens redirect to `/blog?subscription=invalid`.

Mailbox provider one-click unsubscribe POSTs use the same endpoint with a form body of `List-Unsubscribe=One-Click`. Valid or already-unsubscribed one-click requests return a direct `200` success response without an HTTPS redirect. Missing or invalid one-click tokens return non-redirect error responses.

## Backend Resources

Blog subscription infrastructure is defined in `infra/blog_subscriptions.tf`.

The V1 architecture uses:

- API Gateway HTTP API for `POST /blog-subscriptions`, `GET /blog-subscriptions/confirm`, `GET /blog-subscriptions/unsubscribe`, and `POST /blog-subscriptions/unsubscribe`.
- Lambda for validation, honeypot handling, DynamoDB writes, SES confirmation emails, confirmation activation, unsubscribe handling, optional admin alerts, and controlled blog post notification sending.
- DynamoDB for subscriber records and notification send tracking.
- SES for confirmation emails, optional admin alerts, and blog post notification emails.
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

The notification send tracking table is created by `aws_dynamodb_table.blog_notification_sends`.

Default table name: `drakesfood-blog-notification-sends`

It is keyed by `postSlug` so each post can be sent once. Dry runs do not write to this table. Real sends first reserve the slug with `status: sending`; repeated real sends for the same slug are rejected to prevent duplicate emails.

The V1 notification sender is intentionally bounded. The Lambda timeout is 60 seconds, sends run in small concurrent batches, and real sends are blocked when the active subscriber count exceeds `blog_notification_max_recipients` (default `50`). Dry runs still report the full count so Drake can see when the list is too large for the V1 synchronous sender.

Send tracking item shape:

```json
{
  "postSlug": "mothers-day-baking",
  "status": "sent",
  "dryRun": "false",
  "startedAt": "2026-05-09T12:00:00.000Z",
  "completedAt": "2026-05-09T12:00:12.000Z",
  "recipientCount": "25",
  "sentCount": "25",
  "failedCount": "0"
}
```

## Blog Notification Sending

Blog post notification metadata lives in `infra/lambda/blog-subscriptions/blog-notification-posts.mjs`. Add new posts there before sending notifications for them.

The manual workflow `.github/workflows/send-blog-notification.yml` invokes the blog subscriptions Lambda with an internal event:

```json
{
  "action": "sendBlogPostNotification",
  "postSlug": "mothers-day-baking",
  "dryRun": true
}
```

Run with `dry_run: true` first. Dry runs count active subscribers and do not send email or mark the post as sent. Run with `dry_run: false` only after reviewing the dry-run output.

Notification emails are sent only to subscribers with `status: active` and an `unsubscribeToken`. Pending and unsubscribed readers are excluded. Each email includes a post link and an unsubscribe link.

Blog notification emails use a multipart plain-text + lightweight HTML format. The plain-text part keeps a readable fallback, and the HTML part may include the post hero image when `blog-notification-posts.mjs` provides `heroImagePath` and `heroImageAlt`. Missing image metadata should not block a send.

Notification emails also include `List-Unsubscribe` and `List-Unsubscribe-Post` headers. The visible unsubscribe link lands on the confirmation page, while mailbox provider one-click unsubscribe requests POST `List-Unsubscribe=One-Click` to the unsubscribe URL and receive non-redirect responses.

## Admin Alerts

Admin alerts are optional emails to Drake when a reader confirms a blog subscription or unsubscribes.

Set `blog_subscriptions_admin_recipient_email` through a local `.tfvars` file or `-var` argument to enable them. Leave it blank to disable them. The Lambda receives this as `BLOG_SUBSCRIPTIONS_ADMIN_RECIPIENT_EMAIL`.

Recommended V1 value:

```hcl
blog_subscriptions_admin_recipient_email = "drakejrobert@gmail.com"
```

Admin alerts use the same configured SES sender as the reader-facing emails. If SES is still in sandbox, `drakejrobert@gmail.com` must be verified as an SES recipient before alerts can be delivered.

Admin alert failures are logged but do not block the reader-facing confirmation or unsubscribe success redirect. Alert bodies intentionally omit the subscriber email address and include only operational metadata such as event type, subscriber ID, timestamp, and source site.

## Privacy

Subscriber email addresses are private data.

- Do not commit subscriber exports.
- Do not add subscriber emails to GitHub issues, logs, screenshots, or docs.
- Prefer logging `subscriberId` and error names instead of raw email addresses or tokens.
- Admin subscription alerts intentionally omit raw subscriber email addresses.
- Confirmation tokens are stored only as SHA-256 hashes.
- Unsubscribe tokens are private bearer-token data. Store them only in DynamoDB, use them only for notification email links, and do not log them.
- Every future notification email must include the subscriber's unsubscribe link. That link should use `GET /blog-subscriptions/unsubscribe?token=<unsubscribe-token>` so the reader lands on the confirmation page before any state change.
- One-click unsubscribe support is limited to mailbox provider POSTs containing `List-Unsubscribe=One-Click`; these requests must not redirect.

## SES

SES sends confirmation emails from the configured sender.

Current production deliverability status as of May 11, 2026:

- SES production access is enabled in `us-east-2`.
- The SES domain identity for `drakesfood.com` is verified.
- Easy DKIM is enabled and verified for `drakesfood.com`.
- OpenTofu manages the SES DKIM CNAME records, apex SPF TXT record, and `_dmarc` TXT record through `infra/email_deliverability.tf`.
- The recommended sender remains `Drake's Food <updates@drakesfood.com>`.

Before production confirmations or notification emails can work:

- Verify `drakesfood.com` as an SES sending identity, or provide a specific verified identity ARN.
- If the AWS account is still in the SES sandbox, verified recipient limitations will apply.
- Set `blog_subscriptions_ses_sender_email` through a local `.tfvars` file or `-var` argument.
- Set `blog_subscriptions_admin_recipient_email` only if Drake should receive confirm/unsubscribe admin alerts.
- Set `blog_subscriptions_ses_identity_arn` only if the sending identity is not the default `drakesfood.com` domain identity in the active AWS account.

If SES is still in sandbox, signup confirmations and blog notifications can only be sent to verified recipient addresses. Request SES production access before inviting public subscribers.

Recommended sender:

```txt
Drake's Food <updates@drakesfood.com>
```

`updates@drakesfood.com` is currently a send-only address, not a real inbox. Do not add a `Reply-To` header until the address is backed by a mailbox or forwarding route where reader replies can actually be received.

### DNS Authentication

The expected DNS authentication records are:

- DKIM: three SES CNAME records under `*._domainkey.drakesfood.com`, generated by SES and managed in OpenTofu.
- SPF: apex TXT record `v=spf1 include:amazonses.com ~all`.
- DMARC: `_dmarc.drakesfood.com` TXT record `v=DMARC1; p=none;`.

Keep DMARC at `p=none` until production test messages have been reviewed in Gmail and Outlook/Hotmail. A stricter policy can be considered later after delivery looks stable and any reply mailbox/forwarding decision is settled.

Custom MAIL FROM is intentionally not configured for V1. Add it only if real deliverability results show SPF alignment or bounce-domain branding is worth the extra DNS and SES setup.

### Production Test Matrix

After DNS changes are applied and have propagated, test with accounts Drake controls:

- Gmail: submit signup, confirm receipt location, click the confirmation link, and confirm the subscriber becomes active.
- Outlook/Hotmail: repeat the same flow and specifically check whether the confirmation lands in Inbox, Junk, or Other.
- Run a `Send Blog Notification` dry run after at least one test subscriber is active.
- Send a controlled notification to Gmail and Outlook/Hotmail test subscribers, then record whether each lands in Inbox, Promotions/Other, or Junk.
- Confirm the visible unsubscribe link opens the confirmation page.
- Confirm mailbox unsubscribe UI appears where supported and does not expose subscriber email addresses or tokens in logs.

Do not paste raw subscriber email addresses, tokens, or message headers into GitHub issues or PRs. Summarize results by mailbox provider and folder instead.

## Cost Expectations

Expected low-volume cost should be very small:

- SES sending is roughly `$0.10` per 1,000 emails.
- Lambda, API Gateway, CloudWatch Logs, and DynamoDB pay-per-request usage should usually be free-tier or pennies at early traffic levels.
- 100 subscribers x 4 posts/month is about 400 notification emails/month, roughly `$0.04` in SES send cost.
- 1,000 subscribers x 4 posts/month is about 4,000 notification emails/month, roughly `$0.40` in SES send cost.

CloudWatch log volume and repeated tests can add small extra cost. Keep logs concise and avoid logging subscriber lists.

## OpenTofu Deployment

Useful variables for this feature are defined in `infra/variables.tf`:

- `blog_subscriptions_api_name`
- `blog_subscriptions_allowed_origins`
- `blog_subscriptions_admin_recipient_email`
- `blog_subscriptions_lambda_function_name`
- `blog_subscriptions_log_retention_days`
- `blog_subscriptions_max_body_bytes`
- `blog_subscriptions_ses_identity_arn`
- `blog_subscriptions_ses_sender_email`
- `blog_subscriptions_source_site`
- `blog_subscriptions_table_name`
- `blog_notification_sends_table_name`
- `blog_notification_max_recipients`
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
AWS_PROFILE=drakesfood tofu output -raw blog_notification_sends_table_name
```

## GitHub Actions Deployment

The static site deploy workflow is `.github/workflows/deploy.yml`. It runs on pushes to `main`.

Required GitHub repository variable:

- `BLOG_SUBSCRIPTIONS_API_BASE_URL`: set to the OpenTofu output `blog_subscriptions_api_endpoint`.
- `BLOG_SUBSCRIPTIONS_LAMBDA_FUNCTION_NAME`: optional for the manual notification workflow; defaults to `drakesfood-blog-subscriptions` when blank.

Related deployment requirements:

- `AWS_ACCESS_KEY_ID` repository secret
- `AWS_SECRET_ACCESS_KEY` repository secret
- `CLOUDFRONT_DISTRIBUTION_ID` repository variable for cache invalidation

If `BLOG_SUBSCRIPTIONS_API_BASE_URL` is missing or blank, production will deploy successfully but the public signup form will use its not-connected-yet fallback.

## Manual Notification Workflow

Use the `Send Blog Notification` GitHub Actions workflow to notify subscribers about a post.

Inputs:

- `post_slug`: blog post slug from `blog-notification-posts.mjs`.
- `dry_run`: use `true` first, then `false` for the real send.

The workflow uses the repository AWS credentials and invokes the blog subscription Lambda directly. The GitHub Actions IAM user needs `lambda:InvokeFunction` permission for that Lambda, which OpenTofu grants.

### Safe Send Procedure

1. Add the post metadata to `infra/lambda/blog-subscriptions/blog-notification-posts.mjs` in the same PR or a prior PR that publishes the blog post.
2. Confirm the post URL is live on `https://drakesfood.com`.
3. Open GitHub Actions and choose `Send Blog Notification`.
4. Enter the post slug exactly as it appears in `blog-notification-posts.mjs`.
5. Run with `dry_run` set to `true`.
6. Review the workflow output for `recipientCount`, `maxRecipients`, and `overRecipientLimit`.
7. If `overRecipientLimit` is `true`, do not run a real send; either raise the cap intentionally after testing or build a queued sender.
8. If the dry run looks correct, rerun the workflow with `dry_run` set to `false`.
9. Confirm the workflow output shows the expected `sentCount` and `failedCount`.
10. If failures occurred, review CloudWatch logs by `subscriberId`, not by email address.

### Duplicate Send Prevention

Real sends reserve the post slug in `drakesfood-blog-notification-sends` before sending. If a row already exists for that `postSlug`, the Lambda returns a duplicate-send response and sends nothing.

Dry runs do not create a tracking row and can be repeated safely.

If you need to resend a post intentionally, do not edit DynamoDB casually. First confirm why the resend is needed, whether some subscribers already received the message, and whether a new issue should track a safe resend or force-send path.

### Disable Sending

Fast ways to prevent real notification sends:

- Do not run the `Send Blog Notification` workflow with `dry_run: false`.
- Remove or blank the SES sender value in the OpenTofu variables and apply; real sends fail before reserving the post slug when `SES_SENDER_EMAIL` is missing.
- Temporarily disable the GitHub Actions workflow in GitHub if needed.
- As a stronger infrastructure change, remove the GitHub Actions IAM `lambda:InvokeFunction` permission and apply OpenTofu.

The public signup form can also be effectively disabled by blanking `BLOG_SUBSCRIPTIONS_API_BASE_URL` and redeploying; the form remains visible but reports that email updates are not connected.

### Failure Recovery

Common failure cases:

- Missing SES sender: configure `blog_subscriptions_ses_sender_email` and apply OpenTofu; no post slug should be reserved.
- SES sandbox recipient failure: verify recipients for testing or request SES production access.
- `overRecipientLimit: true`: do not force a real send; increase `blog_notification_max_recipients` only after testing or build a queued sender.
- Duplicate send response: a send row already exists for the post slug. Review the tracking row before deciding whether any manual recovery is safe.
- Partial failures with `status: failed`: some subscribers may have received the email. Review counts and logs before considering any resend.

Avoid deleting or editing send-tracking rows unless you have confirmed exactly what was sent. Manual DynamoDB edits can cause duplicate emails.

### Smoke Testing Production

After OpenTofu apply and deploy:

1. Submit your own email through the public signup form.
2. Confirm the confirmation email arrives.
3. Click the confirmation link and verify the subscriber row becomes `active`.
4. Use the stored `unsubscribeToken` to open the unsubscribe confirmation URL in a browser.
5. Confirm the GET page does not unsubscribe by itself.
6. Submit the unsubscribe form and verify the row becomes `unsubscribed`.
7. Subscribe and confirm again if you want your address active for notification dry-run/real-send testing.
8. Run `Send Blog Notification` with `dry_run: true` for a known post slug.

Do not use real subscriber addresses in screenshots, docs, issue comments, or PR comments while testing.

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

## Adding Future Blog Posts

When publishing a new blog post that should support email notification:

- Add the public blog post content and route metadata as usual.
- Add notification metadata to `infra/lambda/blog-subscriptions/blog-notification-posts.mjs` with `slug`, `title`, `summary`, and `path`.
- Keep the notification `summary` concise and accurate; it becomes email copy.
- After merge/deploy, run the manual workflow with `dry_run: true` before sending.

## Follow-Up Work

- A future queued sender can replace the V1 synchronous sender if the subscriber list grows beyond the configured cap.
