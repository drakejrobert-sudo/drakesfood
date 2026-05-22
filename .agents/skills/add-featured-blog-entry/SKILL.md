---
name: add-featured-blog-entry
description: Use when adding a new featured blog entry without losing or overwriting earlier posts.
---

<!-- AI_CONTEXT_VERSION: 2026-05-22; generated from .ai-source. -->

# Add Featured Blog Entry

Use this skill when adding a new featured blog entry without losing or overwriting earlier posts.

## Steps

1. Inspect existing blog data, route config, metadata, sitemap, and assets before editing.
2. Add the new entry as an addition, not a replacement, unless the request explicitly says to remove old content.
3. Keep previous blog entries reachable and preserve slugs.
4. Update static route metadata and sitemap for indexed posts.
5. Run Angular checks appropriate to content changes.

## Output format

Summarize files changed, previous posts preserved, new slug, assets, and verification.

## Project-specific cautions

- Do not add accounts, comments, payments, CMS complexity, databases, or Instagram scraping unless explicitly requested.
- Do not break static deployment to S3 and CloudFront.
- Do not invent RecipeSensei pricing, availability, or feature claims beyond existing project content.
- Do not commit OpenTofu state, tfvars, AWS credentials, tokens, private certificates, or real environment values.
