# Security and Privacy

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
