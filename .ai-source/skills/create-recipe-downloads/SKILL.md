---
name: create-recipe-downloads
description: Use when creating downloadable recipe content or RecipeSensei-compatible recipe data.
---

# Create Recipe Downloads

Use this skill when creating downloadable recipe content or RecipeSensei-compatible recipe data.

## Steps

1. Inspect existing recipe and download conventions.
2. Keep recipe copy readable for humans.
3. Structure ingredients, steps, tags, notes, and metadata consistently enough for RecipeSensei import.
4. Avoid adding tracking, accounts, or server dependencies.
5. Verify links and static assets after generation.

## Output format

List generated downloads/data files and compatibility assumptions.

## Project-specific cautions

- Do not add accounts, comments, payments, CMS complexity, databases, or Instagram scraping unless explicitly requested.
- Do not break static deployment to S3 and CloudFront.
- Do not invent RecipeSensei pricing, availability, or feature claims beyond existing project content.
- Do not commit OpenTofu state, tfvars, AWS credentials, tokens, private certificates, or real environment values.
