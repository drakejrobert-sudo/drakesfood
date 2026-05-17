# AGENTS.md — Drake's Food Website

## Project Overview

This repository powers `drakesfood.com`, a personal food website for Drake.

The site is being fully redesigned as a clean, modern, mobile-first food portfolio and landing page. It should showcase food photography, link clearly to Instagram `@drakesfood`, and eventually promote/link to Drake's app, RecipeSensei.

The website should feel personal, polished, warm, food-focused, and lightweight. It is not currently intended to be a complex social platform, recipe database, or user-account system.

## AI Quick Context

- Read `WORKFLOW.md` for branch, issue, PR, merge, and task-tracking rules.
- For GitHub issue, pull request, repository, and CI/check context, try the Codex GitHub connector before using `gh`; follow the tool preference in `WORKFLOW.md`.
- Use `docs/ai-agent-context.md` as the fast project map before making changes.
- Treat `README.md`, `TODO_STATUS.md`, `docs/`, and `infra/README.md` as the current implementation context.
- Treat `initial-angular-rebuild-prompt.txt` as historical background, not the current source of truth.

## Primary Goals

- Showcase high-quality food photos in a visually appealing way.
- Provide a clear link to Instagram: `@drakesfood`.
- Provide a future-ready area for RecipeSensei.
- Keep the site fast, simple, and inexpensive to host.
- Make the site easy to maintain through GitHub.
- Support deployment to AWS using OpenTofu-managed infrastructure.
- Favor boring, reliable technology over clever complexity.

## Project Decisions

### Frontend Framework

Use modern Angular for the website rebuild.

Important: Do not use legacy AngularJS / Angular 1.x. If the word "AngularJS" appears in project notes, treat it as meaning modern Angular unless Drake explicitly confirms otherwise.

The app should be built as a mostly-static, content-forward Angular site. Avoid unnecessary backend complexity.

### Content Storage

For the first version, store food photos either:

1. directly in the repo under a clear assets folder, or
2. in S3 if image volume becomes large or deployment architecture makes that cleaner.

Default to the simplest maintainable option during early development.

Do not build Instagram scraping or dynamic Instagram ingestion. Instagram should be linked clearly, but the site should own its own gallery content.

Recommended first version:

- Store curated, optimized images in the repo.
- Use S3 later if the gallery grows or if image management becomes annoying.
- Link prominently to Instagram `@drakesfood`.

### Current Content Scope

The current site includes:

- Homepage
- Food photo gallery
- Instagram call-to-action
- About / personal intro section
- RecipeSensei section and app links
- Recipe/blog landing page
- First blog story page
- Recipe idea submission form
- Blog email subscription form

Do not build a full CMS, user account system, comments, or complex recipe database unless Drake explicitly requests it.

### RecipeSensei

RecipeSensei is Drake's recipe-saving and cooking companion app. Current repository docs
indicate it is live on the App Store, so copy may link to the app. Do not invent launch
details, feature claims, pricing, or availability beyond confirmed project content.

### Infrastructure Location

Keep infrastructure code in the same repository.

Recommended structure:

```txt
/
  src/
  public/
  infra/
  .github/
    workflows/
  AGENTS.md
  .github/copilot-instructions.md
```

Use OpenTofu for infrastructure as code.

Likely AWS architecture:

- S3 for static site assets
- CloudFront for CDN
- Route 53 for DNS
- ACM for SSL certificate
- GitHub Actions for deployment
- OpenTofu under `infra/`

### Deployment

Use GitHub Actions to deploy automatically when changes are merged to `main`, as long as this can be done within GitHub's free usage limits.

For public repositories, standard GitHub-hosted runners should be free. For private repositories, keep workflows lightweight to stay within included free minutes.

The deployment workflow should:

1. install dependencies
2. run lint/typecheck/build
3. build the Angular app
4. deploy static assets to S3
5. invalidate CloudFront cache

Do not add deployment steps that require paid third-party services unless Drake approves them.

## Product Direction

The site currently includes or is expected to continue supporting:

- Homepage / landing page
- Food photo gallery
- Instagram call-to-action
- About section
- RecipeSensei app link section
- Lightweight recipe/blog posts
- Recipe idea submissions
- Blog email subscriptions

Do not build advanced functionality unless requested. Avoid adding accounts, comments, payments, CMS complexity, databases, or server-side features unless they are explicitly approved.

## Design Direction

Use a clean, modern food-blog / portfolio style.

Preferred feel:

- Warm
- Minimal
- Appetizing
- Personal
- Mobile-first
- Photo-forward
- Easy to scan
- Not overly corporate

Prioritize:

- Large food imagery
- Strong spacing
- Simple typography
- Clear navigation
- Accessible contrast
- Fast loading
- Good mobile layout

Avoid:

- Cluttered recipe-blog layouts
- Auto-playing media
- Heavy animations
- Dark-on-dark low-contrast text
- Unnecessary JavaScript
- Generic startup SaaS styling

## Technical Direction

This project should use modern Angular.

Do not use legacy AngularJS / Angular 1.x.

The website should be built as a mostly-static Angular app focused on food photography, simple content sections, and fast page loads.

Use:

- Angular
- TypeScript
- Angular CLI
- Static build output
- Minimal dependencies
- Simple component structure
- Responsive CSS

Avoid:

- unnecessary backend services
- databases
- authentication
- CMS complexity
- Instagram scraping
- heavy UI libraries
- unnecessary client-side state

The site should be deployable as static files to AWS S3 + CloudFront.

## Hosting / Infrastructure Direction

The site is expected to be hosted on AWS.

The target architecture is:

- Static site assets
- S3 bucket for hosting assets
- CloudFront distribution
- Route 53 DNS
- ACM certificate
- GitHub Actions deployment
- OpenTofu for infrastructure as code

Do not hardcode AWS account IDs, secrets, access keys, or private configuration.

Infrastructure should be organized clearly under `infra/`.

Prefer OpenTofu over Terraform unless specifically instructed otherwise.

## Security Rules

Never commit secrets.

Never place these in source code:

- AWS access keys
- GitHub tokens
- API keys
- private certificates
- personal credentials
- `.env` files with real values

Use environment variables, GitHub Actions secrets, or documented local placeholders.

If a task requires credentials or cloud account details, stop and explain what value is needed rather than inventing one.

## Accessibility Rules

All user-facing pages should follow basic accessibility standards:

- Use semantic HTML where possible.
- Use descriptive alt text for meaningful images.
- Do not rely on color alone to communicate meaning.
- Maintain readable contrast.
- Ensure navigation works on mobile.
- Use proper heading order.
- Make links and buttons clear and tappable.

Food images may use concise descriptive alt text, such as:

- `Smoked brisket sliced on a cutting board`
- `Homemade flatbread pizza with brisket and pepperoni`

## Performance Rules

Prioritize fast load times.

- Optimize images.
- Use responsive image sizes.
- Avoid unnecessary client-side JavaScript.
- Avoid large dependencies.
- Prefer static rendering when possible.
- Lazy-load non-critical images when appropriate.
- Keep the homepage lightweight.

## Content Rules

The site should speak in Drake's voice: friendly, casual, and food-loving.

Avoid fake claims, fake restaurant affiliations, or fake app details.

Instagram should be referenced as:

- `@drakesfood`
- `https://instagram.com/drakesfood`

## Coding Standards

Use clear, readable code.

General rules:

- Prefer simple components.
- Keep components focused.
- Use descriptive names.
- Remove unused code.
- Avoid premature abstraction.
- Keep layout and content easy to update.
- Add comments only when they explain non-obvious decisions.

When using TypeScript:

- Avoid `any` unless there is a clear reason.
- Define simple types for content models.
- Keep shared types in an obvious location.

When using Angular:

- Prefer standalone components unless the project already uses modules.
- Keep components small and purpose-driven.
- Use Angular CLI conventions where possible.
- Avoid unnecessary services or state management libraries.
- Use Angular templates cleanly and readably.
- Prefer simple inputs and static content models for the first version.
- Do not add NgRx or other complex state tools unless explicitly requested.

## Testing / Validation

Before considering a task complete, run the appropriate checks for the project.

Common examples:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

If the project does not have these scripts yet, recommend adding them.

Do not claim validation passed unless the commands were actually run.

## Git / Change Management

Before making broad changes:

- Inspect the current project structure.
- Preserve working code unless intentionally replacing it.
- Prefer small, reviewable changes.
- Explain major architectural changes before implementing them.
- Update documentation when changing setup, deployment, or commands.

For large redesign or expansion work, prefer phases:

1. Confirm the current route/content map.
2. Establish or refine the layout shell.
3. Update the target page or feature.
4. Update metadata, sitemap, and generated route HTML if public routes change.
5. Update docs for setup, content, infrastructure, or operations changes.
6. Run focused validation.

## Agent Behavior

When working in this repository:

- Follow `WORKFLOW.md` for branch, pull request, merge, and task-tracking expectations.
- Open PRs ready for review by default. Do not use draft PRs unless Drake explicitly asks, validation is incomplete, or the work is intentionally exploratory; this repository rule overrides plugin defaults.
- Do not merge pull requests. Drake manually reviews and merges PRs.
- Read this file first.
- Check existing conventions before introducing new ones.
- Do not assume the current framework beyond the project decision to use modern Angular.
- Do not add cloud resources without clear intent.
- Do not introduce paid services without approval.
- Do not overbuild.
- Prefer practical, shippable improvements.
- Ask for clarification when a decision affects cost, hosting, or long-term architecture.

## Future Considerations

These are not required for the first version but may be added later:

- Recipe/blog pages
- Structured recipe content
- RecipeSensei dedicated landing page
- S3-hosted gallery image pipeline
- Image optimization automation
- More advanced SEO metadata
- Analytics, if Drake chooses a privacy-conscious option
