# Drake's Food

A modern Angular portfolio website for Drake's Food. This first version is a warm, minimal, photo-forward multi-page site with a food gallery preview, Instagram CTA, about section, RecipeSensei links, recipe idea submission, and a recipe/blog coming soon area.

## Getting started

Requirements:

- Node.js 22.13.0 or newer within Node 22 LTS
- npm

Use the pinned local Node version:

```bash
nvm use
```

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm start
```

Build for production:

```bash
npm run build
```

Type check:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

## Project structure

- `src/app/` - Angular components and app entrypoint
- `src/app/pages/` - routed page components for the small static site
- `src/app/data/` - placeholder gallery data
- `src/assets/images/` - local placeholder food assets
- `docs/` - feature contracts and implementation notes
- `infra/` - OpenTofu infrastructure for S3, CloudFront, ACM, and Route 53
- `.github/copilot-instructions.md` - project guidance for Copilot
- `public/` - static assets for app build

## Page structure

The site uses Angular routes for the primary content areas while staying static-first:

- `/` - homepage gateway with hero, gallery preview, Instagram CTA, About, RecipeSensei, submission, and recipes preview sections
- `/gallery` - food gallery page
- `/recipes` - recipes and stories coming soon page
- `/submit` - recipe idea submission page
- `/recipesensei` - RecipeSensei app teaser and links
- `/about` - Drake's Food intro page
- `/recipesensei/support` - RecipeSensei support page
- `/recipesensei/privacy` - RecipeSensei privacy policy page

## Recipe submissions

The V1 recipe submission system is documented in `docs/recipe-submission-system.md`. The detailed API contract is documented in `docs/recipe-submission-api.md`.

## Deployment

The site deploys built Angular assets to the existing `drakesfood.com` S3 bucket through GitHub Actions. HTTPS is handled by CloudFront with an ACM certificate and Route 53 records managed by OpenTofu in `infra/`.

See `infra/README.md` for the one-time OpenTofu setup and required GitHub repository secrets/variables.

## Notes

The site is intentionally mostly static. It is designed for AWS S3 + CloudFront and does not include authentication, backend services, or CMS tools.
