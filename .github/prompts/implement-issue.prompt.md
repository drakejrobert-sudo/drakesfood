---
description: Implement an Issue
---

# Implement an Issue

AI_CONTEXT_VERSION: 2026-05-22
Generated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.

Use when implementing a GitHub issue or requested change.

1. Read project context and the issue/request.
2. Inspect existing patterns before editing.
3. Make the smallest coherent change.
4. Avoid dependencies, secrets, deployment setting changes, and unrelated refactors.
5. Update docs or tests when the behavior surface changes.
6. Run the relevant verification commands and report exactly what ran.

Output: summary, changed files, verification, and residual risks.
