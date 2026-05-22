# Claude Code Instructions

AI_CONTEXT_VERSION: 2026-05-22
Generated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

Use .ai-source as the canonical source of truth. Start with AGENTS.md for a compact generated view, then inspect .ai-source files for deeper project-specific context.

## High-Priority Behavior

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

## Cautions

AI_CONTEXT_VERSION: 2026-05-22
Canonical source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

## Hard rules

- Never store secrets, API keys, environment variables, credentials, tokens, private certificates, or real .env values in AI context files.
- Never include PHI, client data, private testimonial submission fields, or sensitive personal data in public code or AI context.
- Treat public website content as publishable and review claims carefully.
- Avoid unsupported medical, legal, billing, insurance, eligibility, pricing, or app-availability claims.
- Preserve local data and privacy expectations for recipe app work.

## Agent behavior

- If a task requires private values, document placeholders and setup steps instead of inventing or exposing secrets.
- Flag security/privacy uncertainty before implementing broad changes.

## Verification

AI_CONTEXT_VERSION: 2026-05-22
Canonical source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

## Known commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test` currently prints that no test runner is configured.
- Lambda tests live under `infra/lambda/` when relevant and can be run with Node test commands targeted to the changed files.

## Verification expectations

- For AI-context-only changes, run node scripts/ai-sync-context.mjs and node scripts/ai-doctor.mjs.
- For source changes, run the smallest relevant check first, then broader checks when risk warrants it.
- For public website UI changes, review responsive layout and accessibility where practical.
- For import/parser/persistence changes, add focused regression coverage.

## Common checks to add

- Content route changes: metadata, sitemap, static output, and build checks.
- Import/export changes: malformed input, duplicates, unsupported data, backward compatibility, and timeout/error handling.
- Public copy changes: unsupported claims, privacy, accessibility, and tone review.
