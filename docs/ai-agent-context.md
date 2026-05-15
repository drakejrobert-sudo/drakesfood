# AI Agent Context

This is the fast handoff file for AI assistants working on Drake's Food. Read `AGENTS.md`
and `WORKFLOW.md` first, then use this file to find the right code and checks quickly.

## Current Shape

- Modern Angular app with standalone components and static-first routes.
- Public site routes live in `src/app/app.routes.ts`.
- Runtime page metadata lives in `src/app/app.ts`.
- Static route HTML metadata generation lives in `scripts/generate-route-html.mjs`.
- Gallery content lives in `src/app/data/gallery.data.ts`.
- Blog post content lives in `src/app/data/blog-posts.data.ts`.
- Public static assets live in `public/`.
- Angular-managed image assets live in `src/assets/images/`.
- AWS/OpenTofu infrastructure lives in `infra/`.
- Lambda handlers and tests live under `infra/lambda/`.

## High-Value Local Docs

- `README.md` - setup, route map, content and deployment overview.
- `TODO_STATUS.md` - high-level status snapshot; GitHub Issues remain the active backlog.
- `docs/recipe-submission-system.md` - recipe submission frontend, API, infra, and testing notes.
- `docs/recipe-submission-api.md` - recipe submission API contract.
- `docs/blog-email-subscriptions.md` - blog email subscription, unsubscribe, and notification operations.
- `infra/README.md` - OpenTofu setup, state guidance, AWS outputs, and GitHub Actions variables.
- `session-ses_234e-next-steps.md` - temporary SES follow-up notes; verify freshness before using.
- `initial-angular-rebuild-prompt.txt` - historical rebuild prompt, not current source of truth.

## Common Change Paths

When adding or changing a public route:

- Update `src/app/app.routes.ts`.
- Add or update metadata in `src/app/app.ts`.
- Add matching static metadata in `scripts/generate-route-html.mjs`.
- Add the canonical URL to `public/sitemap.xml` if the page should be indexed.
- Preserve redirects when renaming public URLs.

When adding gallery photos:

- Put optimized source images in `src/assets/images/`.
- Put card-sized variants in `src/assets/images/gallery-cards/`.
- Add entries to `src/app/data/gallery.data.ts` with specific `altText`.
- Keep non-hero images lazy-loaded and reserve high fetch priority for the main hero only.

When adding blog content:

- Add the post data to `src/app/data/blog-posts.data.ts`.
- Put post assets under `public/assets/blog/<post-slug>/`.
- Add route metadata for `/blog/<post-slug>` in both metadata locations.
- Add a sitemap entry if the post should be indexed.
- If notifying subscribers, use the manual GitHub Actions workflow after dry-run review.

When changing forms or runtime API config:

- Recipe submissions use `RecipeSubmissionApiService` and `public/app-config.json`.
- Blog subscriptions use `BlogSubscriptionApiService` and `public/app-config.json`.
- Keep the not-configured fallback behavior intact for missing API base URLs.
- Check the matching docs under `docs/` and the Lambda implementation under `infra/lambda/`.

When changing infrastructure:

- Read `infra/README.md` first.
- Do not commit `.tfvars`, state, plans, credentials, account IDs, or private certificates.
- Prefer documenting required values over inventing them.
- Ask before changes that affect AWS cost, DNS, certificates, state backend, or production behavior.

## Validation Matrix

- Content-only docs change: no build required unless code examples or commands changed.
- Angular content/component/style change: run `npm run lint`, `npm run typecheck`, and `npm run build`.
- UI/layout/accessibility change: also run the app locally and review desktop and mobile viewports.
- Route or SEO metadata change: run `npm run build` and inspect generated route HTML as needed.
- Lambda change: run the relevant `node --test infra/lambda/.../*.test.mjs` test, then run app checks if frontend wiring changed.
- OpenTofu change: run formatting/validation/plan only with the correct AWS profile and never commit generated state.

Only claim a check passed if it was actually run.

## Existing AI Surfaces

- `AGENTS.md` is the broad agent policy and product direction.
- `.github/copilot-instructions.md` is the primary GitHub Copilot instruction file.
- `copilot-instructions.md` is a root copy kept for tools that look outside `.github/`.
- `.vscode/mcp.json` enables the Angular CLI MCP server for tools that support MCP.

For Codex work in this repo, the most useful built-in capabilities are:

- Browser or frontend testing/debugging tools for visual QA after UI changes.
- OpenAI/browser search only when checking current external facts or docs.
- GitHub tools when a task explicitly needs issue, PR, or CI context.

## Watchouts

- The app has grown beyond the original simple landing page. Avoid relying only on early rebuild notes.
- RecipeSensei is now represented in repo docs as live on the App Store; do not revert copy to "coming soon" unless Drake asks.
- Metadata is duplicated intentionally between Angular runtime code and generated static route HTML.
- `public/app-config.json` contains local/default runtime config only; deploy writes production values from GitHub repository variables.
- Local OpenTofu state and `.tfvars` may exist in a working tree but are ignored and should not be read into commits.
