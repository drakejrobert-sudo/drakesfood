# WORKFLOW.md - AI Working Agreement

This document defines how AI assistants should collaborate on this repository.

## Default Workflow

- Before making code or documentation changes, check the current branch with `git branch --show-current`.
- If the current branch is `main`, create or switch to a feature branch before editing.
- Work on feature branches, not directly on `main`.
- Keep changes small, reviewable, and aligned with `AGENTS.md`.
- Update `TODO_STATUS.md` when task status changes.
- Run relevant validation before opening a PR.
- Open a pull request when work is ready for review.
- Do not merge pull requests. Drake manually reviews and merges PRs.

## Git Rules For AI Assistants

AI assistants may, when asked to implement work:

- create or use a feature branch
- make code/documentation changes
- commit relevant changes
- push the feature branch
- open or update a pull request

AI assistants must not:

- push directly to `main`
- merge pull requests
- delete remote branches unless asked
- force push unless explicitly approved
- rewrite shared history unless explicitly approved
- commit secrets, credentials, tokens, private certificates, or real `.env` values

## Pull Request Expectations

Every PR should include:

- a concise summary of changes
- validation commands that were run
- local visual review notes for UI-facing changes
- any known limitations or follow-up tasks
- notes about deployment or credential requirements when relevant

If validation cannot be run, state why in the PR description.

## Visual Review

For changes that affect the public site UI, layout, copy, images, accessibility, or styling:

- Run the app locally with `npm start`.
- Open the local Angular dev server in a browser.
- Review the affected pages or sections on desktop and mobile viewport sizes.
- Confirm there are no obvious visual regressions before opening a PR.
- Note the local visual review in the PR description.

If local visual review cannot be completed, state why in the PR description.

## Manual Merge Policy

Drake owns the final merge decision.

Even if CI passes and the PR is mergeable, AI assistants should stop after opening or updating the PR and report:

- PR URL
- validation status
- known blockers
- recommended next steps

## Task Tracking

Use `TODO_STATUS.md` for project status.

When completing, deferring, or discovering work, update the relevant section:

- Completed
- In Progress
- Remaining Tasks
- Notes
- Last Updated

Do not mark work complete unless it has actually been done and validated where applicable.

## Validation

Before considering implementation complete, run the relevant available checks, such as:

```bash
npm run typecheck
npm run build
```

Only claim validation passed if the commands were actually run.

## When To Ask Drake First

Ask before making changes that affect:

- AWS cost or cloud architecture
- DNS, certificates, or production deployment behavior
- public site copy that implies RecipeSensei is launched
- new dependencies or major framework changes
- destructive git operations
- direct changes to `main`
