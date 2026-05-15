# GitHub Copilot Instructions — Drake's Food Website

This repository powers `drakesfood.com`, a personal food website for Drake.

The site is being fully redesigned as a clean, mobile-first food portfolio and landing page. It should showcase food photography, link to Instagram `@drakesfood`, and eventually promote/link to Drake's app, RecipeSensei.

## Priorities

- Follow `WORKFLOW.md` for branch, pull request, merge, and task-tracking expectations.
- Use `docs/ai-agent-context.md` for the current code map, common change paths, and validation matrix.
- Do not merge pull requests. Drake manually reviews and merges PRs.
- Keep the site simple, fast, accessible, and easy to maintain.
- Use modern Angular, not legacy AngularJS / Angular 1.x.
- Favor static or mostly-static architecture.
- Prefer clean design, strong food photography, and mobile-first layouts.
- Avoid overbuilding features that were not requested.
- Do not add accounts, comments, databases, payments, or CMS complexity unless explicitly requested.
- Never commit secrets, AWS keys, tokens, certificates, or real `.env` values.

## Framework Decision

Use modern Angular for this project.

Do not use legacy AngularJS / Angular 1.x. If notes say "AngularJS," interpret that as modern Angular unless Drake specifically says otherwise.

Build the site as a mostly-static Angular app that can deploy to AWS S3 + CloudFront.

## Design Style

The site should feel:

- Warm
- Personal
- Modern
- Food-focused
- Minimal
- Photo-forward

Avoid cluttered recipe-blog patterns, heavy animations, and unnecessary JavaScript.

## Current Content Scope

The site currently includes:

- Homepage
- Food photo gallery
- Instagram call-to-action
- About / personal intro section
- RecipeSensei section and app links
- Recipe/blog landing page and a first story page
- Recipe idea submission form
- Blog email subscription form

Do not build a full CMS, user accounts, comments, payments, or complex recipe database unless Drake explicitly requests it.

## Content Storage

For the first version, use the simplest maintainable approach.

Default to curated, optimized images in the repo. S3 can be used later if the gallery grows or if image management becomes difficult.

Do not build Instagram scraping or dynamic Instagram ingestion. Link to Instagram clearly instead.

Instagram should be referenced as:

- `@drakesfood`
- `https://instagram.com/drakesfood`

## RecipeSensei

RecipeSensei is Drake's app.

Current repository docs indicate RecipeSensei is live on the App Store. Do not invent launch
details, feature claims, pricing, or availability beyond confirmed project content.

## AWS / Deployment

The intended deployment target is AWS using OpenTofu and GitHub Actions.

Likely infrastructure:

- S3
- CloudFront
- Route 53
- ACM
- GitHub Actions
- OpenTofu

Keep infrastructure code in the same repository under `infra/`.

Do not invent AWS account IDs or credentials.

## Technical Expectations

Use the existing project stack if one is already established. If creating the project from scratch, use Angular CLI and TypeScript.

Prefer:

- Angular standalone components
- simple component structure
- responsive CSS
- minimal dependencies
- static build output
- semantic HTML
- accessible links/buttons/images
- optimized images

Avoid:

- unnecessary backend services
- databases
- authentication
- CMS complexity
- Instagram scraping
- heavy UI libraries
- unnecessary client-side state
- NgRx or complex state management unless explicitly requested

Before finishing code changes, run relevant checks such as:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

Only say checks passed if they were actually run.

## Content Voice

Use a friendly, casual, food-loving tone. Keep copy concise and natural.
