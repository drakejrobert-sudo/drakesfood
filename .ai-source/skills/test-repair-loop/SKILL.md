---
name: test-repair-loop
description: Use when tests, builds, or checks fail and need a focused repair cycle.
---

# Test Repair Loop

Use this skill when tests, builds, or checks fail and need a focused repair cycle.

## Steps

1. Capture the exact command and failure.
2. Identify the smallest likely source of the failure.
3. Patch only the relevant files.
4. Re-run the focused failing command before broader checks.
5. Stop and report if the failure appears unrelated to the requested change.

## Output format

Failure summary, fix summary, commands rerun, and remaining risk.

## Project-specific cautions

- Do not add accounts, comments, payments, CMS complexity, databases, or Instagram scraping unless explicitly requested.
- Do not break static deployment to S3 and CloudFront.
- Do not invent RecipeSensei pricing, availability, or feature claims beyond existing project content.
- Do not commit OpenTofu state, tfvars, AWS credentials, tokens, private certificates, or real environment values.
