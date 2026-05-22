# Coding Standards

AI_CONTEXT_VERSION: 2026-05-22
Canonical source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

## General style

- Follow existing project patterns before introducing new abstractions.
- Keep changes small, focused, and reviewable.
- Prefer boring, reliable implementation over clever complexity.
- Use plain Markdown and built-in Node modules for AI context tooling.
- Do not install new packages for this AI context system.

## Formatting expectations

- Preserve established formatting and file organization.
- Keep generated AI files clearly marked with AI_CONTEXT_VERSION: 2026-05-22.
- Avoid duplicating generated content manually; edit .ai-source and run the sync script.

## Dependency rules

- Do not add dependencies unless explicitly requested for app work.
- For this AI context setup, use only built-in Node modules.

## Reviewability expectations

- Keep each change easy to inspect in a PR.
- Separate AI-context/docs/script changes from application behavior changes.
- Only claim checks passed when they were actually run.
