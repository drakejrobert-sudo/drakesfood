# Architecture

AI_CONTEXT_VERSION: 2026-05-22
Canonical source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

## Directory overview

- `src/` contains Angular source.
- `src/app/data/` contains gallery and blog data.
- `public/` contains public static assets, robots, sitemap, and runtime app config.
- `src/assets/images/` contains Angular-managed images.
- `scripts/generate-route-html.mjs` generates static route metadata HTML.
- `infra/` contains OpenTofu infrastructure and Lambda code/tests.
- `docs/` contains operational documentation for APIs and subscriptions.

## Important structure

- Read existing source and docs before choosing where new content belongs.
- Keep public routes, metadata, generated static files, and tests aligned when applicable.
- Treat generated/build/local IDE files as non-source unless the repo already tracks them intentionally.

## Tests

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test` currently prints that no test runner is configured.
- Lambda tests live under `infra/lambda/` when relevant and can be run with Node test commands targeted to the changed files.

## Deployment/build clues

- Use `package.json`, Angular CLI config, GitHub workflows, `infra/README.md`, and OpenTofu files as the source of truth.
- Static deployment targets AWS S3, CloudFront, Route 53, and ACM through GitHub Actions/OpenTofu.
- Do not change deployment settings for AI-context-only work.

## Unknowns to verify before big changes

- Confirm current branch, issue scope, and exact target route/app flow.
- Confirm public claims, pricing, legal, medical, billing, or app availability details before publishing.
