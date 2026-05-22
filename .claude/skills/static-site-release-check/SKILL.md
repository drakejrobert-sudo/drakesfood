---
name: static-site-release-check
description: Use before changes that affect deployability, routes, SEO metadata, or public static assets.
---

# Static Site Release Check

Use this skill when Use before changes that affect deployability, routes, SEO metadata, or public static assets.

## Steps

1. Check routes, sitemap, robots, metadata, generated static HTML, public config, and asset paths.
2. Confirm no secrets or local config values entered generated assets.
3. Run `npm run build` when route or Angular source changed.
4. Flag any deployment-risking infrastructure or cache behavior separately.

## Output format

Return pass/fail checks with exact commands run.

## Project-specific cautions

- Do not add accounts, comments, payments, CMS complexity, databases, or Instagram scraping unless explicitly requested.
- Do not break static deployment to S3 and CloudFront.
- Do not invent RecipeSensei pricing, availability, or feature claims beyond existing project content.
- Do not commit OpenTofu state, tfvars, AWS credentials, tokens, private certificates, or real environment values.
