---
applyTo: "**"
---

# Testing Instructions

AI_CONTEXT_VERSION: 2026-05-22
Generated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

AI_CONTEXT_VERSION: 2026-05-22
Canonical source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

## Known commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test` currently prints that no test runner is configured.
- Lambda tests live under `infra/lambda/` when relevant and can be run with Node test commands targeted to the changed files.

## Verification expectations

- For AI-context-only changes, run node scripts/ai-sync-context.mjs and node scripts/ai-doctor.mjs.
- For source changes, run the smallest relevant check first, then broader checks when risk warrants it.
- For public website UI changes, review responsive layout and accessibility where practical.
- For import/parser/persistence changes, add focused regression coverage.

## Common checks to add

- Content route changes: metadata, sitemap, static output, and build checks.
- Import/export changes: malformed input, duplicates, unsupported data, backward compatibility, and timeout/error handling.
- Public copy changes: unsupported claims, privacy, accessibility, and tone review.
