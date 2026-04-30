# Drake's Food Website — TODO Status

## ✅ Completed

- [x] Modern Angular project setup
- [x] Standalone components created
- [x] Hero section built with CTA
- [x] Gallery preview component built
- [x] Instagram CTA added
- [x] About section added
- [x] RecipeSensei teaser section added
- [x] Recipe/blog section marked as coming soon
- [x] Footer component added
- [x] Gallery data model created
- [x] Real images added to `src/assets/images/`
- [x] Hero image updated to use a real asset
- [x] Gallery data updated to use real assets
- [x] Responsive styling applied
- [x] Responsive image loading and sizing applied
- [x] Node LTS version pinned with `.nvmrc`
- [x] GitHub Actions deployment workflow added for existing S3 bucket
- [x] HTTPS enabled with CloudFront, ACM, and Route 53
- [x] Existing S3 bucket imported into OpenTofu state
- [x] CloudFront distribution ID configured for GitHub Actions invalidations
- [x] GitHub Actions AWS credentials configured
- [x] OpenTofu-managed GitHub Actions deploy IAM policy applied
- [x] First S3 deployment from GitHub Actions verified
- [x] Upgrade GitHub Actions workflows to Node 24-native action versions
- [x] Accessibility audit and core accessibility fixes
- [x] Image file optimization/compression
- [x] SEO metadata and structured data
- [x] ESLint lint configuration
- [x] Build/lint/typecheck validation in CI
- [x] Purple visual theme accents and ninja chef mascot
- [x] Replaced temporary ninja chef SVG with transparent PNG avatar
- [x] Responsive testing on mobile/tablet/desktop
- [x] App builds successfully
- [x] TypeScript type checking passes
- [x] Recipe submission API contract documented
- [x] Recipe submission AWS infrastructure defined
- [x] Recipe submission Lambda handler implemented
- [x] Recipe submission email notifications added
- [x] Recipe submission frontend wired to runtime-configured API
- [x] Recipe submission system documentation added

## 🔄 In Progress

- [ ] Add recipe submission security and spam hardening — #30
- [ ] Conduct performance and accessibility review — #17

## 📋 Remaining Tasks

Active work is now tracked in GitHub Issues. Pull the next task from the highest-priority open issue and use an issue-scoped feature branch.

### Content & Visuals

- [ ] Finalize copy for all sections — #15
- [ ] Add more gallery images or full gallery page (deferred for now) — #19
- [ ] Add RecipeSensei launch details once available — #21
- [ ] Refine About section content — #16
- [ ] Add optional recipe/blog details page later — #22
- [ ] Add recipe submission security hardening — #30

### Deployment & Infrastructure

- [x] Set up AWS S3 + CloudFront hosting
- [x] Configure Route 53 and ACM
- [x] Create deployment pipeline in GitHub Actions
- [x] Add build/lint/typecheck validation in CI

### Quality & Testing

- [x] Add lint configuration (ESLint)
- [ ] Add Angular testing support — #18
- [x] Perform responsive testing on mobile/tablet/desktop
- [ ] Conduct performance and accessibility review — #17
- [ ] Add analytics and monitoring if desired — #20

## Notes

- Gallery now uses real food photography from `src/assets/images/`
- Hero now uses `markaritaOoniPizza.jpeg`
- Remaining image assets are available for future gallery expansion
- Gallery expansion is intentionally deferred until the current photo set has been reviewed in the live layout
- Gallery images now lazy-load and use fixed aspect ratios for steadier responsive rendering
- Hero image is prioritized for initial page load
- Raster food photos are optimized to 1280px wide with high-quality JPEG compression
- GitHub Actions deploys `dist/drakesfood-app/browser` to existing S3 bucket `drakesfood.com` in `us-east-2`
- GitHub repository has AWS deployment credentials configured
- HTTPS now serves through CloudFront for `https://drakesfood.com` and `https://www.drakesfood.com`
- HTTP now redirects to HTTPS through CloudFront
- CloudFront distribution ID is `ETNCPE8F2TB5D`
- OpenTofu local state currently manages the imported S3 bucket plus CloudFront, ACM, Route 53, bucket policy, and bucket public access block
- Latest deployment succeeded, including S3 sync and CloudFront invalidation for distribution `ETNCPE8F2TB5D`
- GitHub Actions workflows now use Node 24-native action versions without the temporary Node 24 override
- Accessibility pass added a main landmark, skip link, visible focus states, reduced-motion handling, section labels, clearer external link labels, and improved RecipeSensei badge contrast
- Static SEO pass added canonical URL, robots metadata, Open Graph and Twitter card tags, and WebSite JSON-LD
- SEO follow-up added `Drakes Food`, `drakesfood`, and `@drakesfood` brand aliases plus `robots.txt` and `sitemap.xml`
- CI now runs ESLint linting before type checking and production builds
- Angular test runner setup remains deferred and tracked separately
- RecipeSensei remains marked as "coming soon" until launch
- Instagram link remains `https://instagram.com/drakesfood`
- Recipe submissions started with a frontend-only form section; live API wiring is now in progress.
- Recipe submission API contract is documented before backend and infrastructure implementation.
- Recipe submission infrastructure is defined with OpenTofu using API Gateway, Lambda, DynamoDB, SES permissions, and CloudWatch logs.
- Recipe submission Lambda handler validates server-side input, handles honeypot submissions, and writes accepted ideas to DynamoDB.
- Recipe submission email notifications are sent through SES after accepted submissions are stored.
- Recipe submission frontend wiring uses runtime app config so the API endpoint can be set after OpenTofu apply.
- Recipe submission security hardening is being added with Lambda origin checks, JSON content-type enforcement, request body size limits, CORS allowlists, throttling, and honeypot handling.
- Recipe submission system documentation now covers frontend wiring, API behavior, infrastructure, deployment, testing, and CloudWatch logs.
- Generic `/favicon.ico` and `/favicon.png` fallbacks should match the named chef-ninja favicon files for browsers that request default favicon paths directly.
- Purple theme accents now use shared CSS variables, with a ninja chef mascot in the hero and SVG favicon support
- Ninja chef mascot now uses a transparent PNG generated with ChatGPT, resized to 128px for the hero and 192px for the favicon
- Full-size source mascot image is stored at `design/source-images/chef-ninja-avatar-original.png` for future edits and is not deployed by the Angular build
- Favicon links now use named mascot files to avoid stale browser caches of the old Angular icon
- Responsive screenshot review covered `375px`, `430px`, `768px`, `820px`, `1024px`, and `1280px` viewports
- Shared section width and CTA button styles now live in global styles so they apply inside Angular child components
- Tablet hero image height is capped to avoid an oversized single-column hero before the desktop breakpoint
- GitHub Issues are now the source of truth for active task tracking; `TODO_STATUS.md` is a high-level snapshot
- Performance review removed the external Google Fonts request and added explicit sizing/decoding hints to key images

## Last Updated

April 30, 2026
