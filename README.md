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
- `src/app/data/` - static gallery data and content models
- `src/assets/images/` - local optimized food photography and site image assets
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

## Gallery content

Gallery photos are managed in the repo as static assets. Add optimized food photos under `src/assets/images/`, then add entries in `src/app/data/gallery.data.ts` with a stable `slug`, clear `category`, concise description, and specific `altText`. The homepage preview uses the first few gallery entries, while `/gallery` renders the full collection.

## Image Guidelines

Keep source gallery photos around `1280px` on the long edge unless a larger display use is needed. Add card-sized variants under `src/assets/images/gallery-cards/` at roughly `540x720` for gallery grids and homepage preview cards, then set `cardImageUrl` on the matching gallery item. Use the full `imageUrl` only for larger placements such as the hero or future detail pages.

For new food photos:

- Use descriptive filenames that match the gallery item slug or source filename.
- Strip private metadata before committing new originals when possible.
- Keep gallery card variants small enough for grid usage; avoid loading full-resolution phone images in card layouts.
- Keep `altText` specific to the visible food, not generic text like `food photo`.
- Preserve explicit image dimensions in templates to reduce layout shift.
- Lazy-load non-hero gallery images and reserve `fetchpriority="high"` for the primary hero image only.

## SEO and metadata

The Angular app updates page titles, meta descriptions, canonical URLs, Open Graph tags, and Twitter/X card tags when primary routes change. Keep canonical metadata pointed at the apex domain, `https://drakesfood.com`, and use the default food photo preview image unless a future route has a stronger route-specific image.

When adding public pages, add route metadata in `src/app/app.ts` and include the canonical page in `public/sitemap.xml` if it should be indexed. Redirect aliases, such as `/submit-idea`, should point canonical metadata at the main route to avoid duplicate indexed pages.

## Recipe submissions

The V1 recipe submission system is documented in `docs/recipe-submission-system.md`. The detailed API contract is documented in `docs/recipe-submission-api.md`.

## Deployment

The site deploys built Angular assets to the existing `drakesfood.com` S3 bucket through GitHub Actions. HTTPS is handled by CloudFront with an ACM certificate and Route 53 records managed by OpenTofu in `infra/`.

See `infra/README.md` for the one-time OpenTofu setup and required GitHub repository secrets/variables.

## Production Routing

The canonical public URL is `https://drakesfood.com/`. The `www.drakesfood.com` hostname is also served by the same CloudFront distribution for compatibility, but page metadata, sitemap entries, and structured data should point to the apex domain.

CloudFront redirects plain HTTP requests to HTTPS and maps S3 `403`/`404` responses back to `/index.html` so direct refreshes of Angular routes such as `/gallery`, `/recipes`, `/submit`, `/recipesensei`, and `/about` load the static app instead of an S3 error page.

## Notes

The site is intentionally mostly static. It is designed for AWS S3 + CloudFront and does not include authentication, backend services, or CMS tools.
