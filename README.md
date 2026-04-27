# Drake's Food

A modern Angular portfolio website for Drake's Food. This first version is a warm, minimal, photo-forward homepage with food gallery preview, Instagram CTA, about section, RecipeSensei teaser, and a recipe/blog coming soon area.

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
- `src/app/data/` - placeholder gallery data
- `src/assets/images/` - local placeholder food assets
- `infra/` - OpenTofu infrastructure for S3, CloudFront, ACM, and Route 53
- `.github/copilot-instructions.md` - project guidance for Copilot
- `public/` - static assets for app build

## Deployment

The site deploys built Angular assets to the existing `drakesfood.com` S3 bucket through GitHub Actions. HTTPS is handled by CloudFront with an ACM certificate and Route 53 records managed by OpenTofu in `infra/`.

See `infra/README.md` for the one-time OpenTofu setup and required GitHub repository secrets/variables.

## Notes

The site is intentionally mostly static. It is designed for AWS S3 + CloudFront and does not include authentication, backend services, or CMS tools.
