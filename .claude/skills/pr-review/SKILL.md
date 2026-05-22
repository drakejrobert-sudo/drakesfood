---
name: pr-review
description: Use when reviewing a PR or local diff for project-specific correctness and safety.
---

<!-- AI_CONTEXT_VERSION: 2026-05-22; generated from .ai-source. -->

# Pr Review

Use this skill when reviewing a PR or local diff for project-specific correctness and safety.

## Steps

1. Read `.ai-source/project.md`, `.ai-source/testing.md`, and the changed files.
2. Look first for bugs, regressions, missing tests, privacy/security issues, deployment risk, and unsupported claims.
3. Check generated AI context only for marker/version consistency when relevant.
4. Do not focus on style unless it affects correctness or maintainability.

## Output format

Findings first, ordered by severity, with file/line references when possible.

## Project-specific cautions

- Do not add accounts, comments, payments, CMS complexity, databases, or Instagram scraping unless explicitly requested.
- Do not break static deployment to S3 and CloudFront.
- Do not invent RecipeSensei pricing, availability, or feature claims beyond existing project content.
- Do not commit OpenTofu state, tfvars, AWS credentials, tokens, private certificates, or real environment values.
