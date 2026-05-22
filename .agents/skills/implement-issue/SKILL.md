---
name: implement-issue
description: Use when implementing a tracked issue or concrete requested change.
---

<!-- AI_CONTEXT_VERSION: 2026-05-22; generated from .ai-source. -->

# Implement Issue

Use this skill when implementing a tracked issue or concrete requested change.

## Steps

1. Read the issue/request and project source docs.
2. Inspect existing patterns and tests.
3. Make small, reviewable edits.
4. Update tests/docs/checks as appropriate.
5. Run relevant verification and report exact commands.

## Output format

Implementation summary, files changed, verification, and assumptions.

## Project-specific cautions

- Do not add accounts, comments, payments, CMS complexity, databases, or Instagram scraping unless explicitly requested.
- Do not break static deployment to S3 and CloudFront.
- Do not invent RecipeSensei pricing, availability, or feature claims beyond existing project content.
- Do not commit OpenTofu state, tfvars, AWS credentials, tokens, private certificates, or real environment values.
