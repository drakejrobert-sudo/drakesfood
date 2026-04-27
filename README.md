# Drake's Food

A modern Angular portfolio website for Drake's Food. This first version is a warm, minimal, photo-forward homepage with food gallery preview, Instagram CTA, about section, RecipeSensei teaser, and a recipe/blog coming soon area.

## Getting started

Requirements:
- Node.js 20.x LTS
- npm

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

## Project structure

- `src/app/` - Angular components and app entrypoint
- `src/app/data/` - placeholder gallery data
- `src/assets/images/` - local placeholder food assets
- `.github/copilot-instructions.md` - project guidance for Copilot
- `public/` - static assets for app build

## Notes

The site is intentionally mostly static. It is designed for future deployment to AWS S3 + CloudFront and does not include authentication, backend services, or CMS tools.
