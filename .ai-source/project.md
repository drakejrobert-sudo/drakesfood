# Drake's Food

AI_CONTEXT_VERSION: 2026-05-22
Canonical source for project-specific AI context. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

## Purpose

Personal food, blog, and recipe website for drakesfood.com with lightweight RecipeSensei connections.

## Tech stack inferred from files

Angular 21, TypeScript, Angular CLI, static route metadata generation, AWS S3/CloudFront/Route 53/ACM via OpenTofu, GitHub Actions.

## Important domain context

- Blog entries and featured blog handling matter; preserve existing posts when adding new featured content.
- Recipes should remain readable for humans and structured enough for RecipeSensei import/export where applicable.
- Static hosting assumptions are important: avoid server-only features unless explicitly requested.
- Public website copy should be polished, food-focused, concise, and accurate.

## Important do not do rules

- Do not add accounts, comments, payments, CMS complexity, databases, or Instagram scraping unless explicitly requested.
- Do not break static deployment to S3 and CloudFront.
- Do not invent RecipeSensei pricing, availability, or feature claims beyond existing project content.
- Do not commit OpenTofu state, tfvars, AWS credentials, tokens, private certificates, or real environment values.

## Common agent tasks

- Add or update blog posts while preserving previous entries.
- Create recipe downloads or recipe data shaped for RecipeSensei compatibility.
- Update public routes, metadata, sitemap entries, and generated static route HTML together.
- Review static-site release safety before deployment.

## Existing project docs to read

- `WORKFLOW.md` for branch, issue, PR, merge, and task-tracking rules.
- `docs/ai-agent-context.md` for the current project map, common change paths, and validation matrix.
- `README.md`, `TODO_STATUS.md`, `docs/`, and `infra/README.md` for current implementation context.
- `initial-angular-rebuild-prompt.txt` is historical background, not the current source of truth.

## Assumptions

- This repo is the drakesfood.com Angular static site.
- The existing AGENTS.md, .github/copilot-instructions.md, and docs/ai-agent-context.md guidance has been consolidated into this source set.
