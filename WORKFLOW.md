# WORKFLOW.md - AI Working Agreement

This document defines how AI assistants should collaborate on this repository.

## Default Workflow

- Before making code or documentation changes, check the current branch with `git branch --show-current`.
- Pick the next highest-priority open GitHub issue before starting implementation work.
- If the current branch is `main`, create or switch to a feature branch for the selected issue before editing.
- Work on issue-scoped feature branches, not directly on `main`.
- Keep changes small, reviewable, and aligned with `AGENTS.md`.
- Update the linked GitHub issue and `TODO_STATUS.md` when project status changes.
- Run relevant validation before opening a PR.
- Open a pull request linked to the issue when work is ready for review.
- Do not merge pull requests. Drake manually reviews and merges PRs.

## Git Rules For AI Assistants

AI assistants may, when asked to implement work:

- create or use an issue-scoped feature branch
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
- a linked issue using a GitHub closing keyword, such as `Closes #12`
- validation commands that were run
- local visual review notes for UI-facing changes
- any known limitations or follow-up tasks
- notes about deployment or credential requirements when relevant

If validation cannot be run, state why in the PR description.

Use GitHub closing keywords in PR descriptions so merging the PR automatically closes the completed issue. Prefer `Closes #<issue-number>` unless the PR only partially addresses the issue.

## Issue Workflow

GitHub Issues are the source of truth for active work.

When starting new work:

- Review open issues and select the next highest-priority issue.
- Confirm the issue is still valid and not blocked.
- Create a feature branch for that issue before editing.
- Use a branch name that includes the issue number and a short description, such as `issue-12-refine-about-copy`.
- Keep the branch focused on the selected issue.

When opening a PR:

- Link the issue with `Closes #<issue-number>` when the PR fully completes the issue.
- Use `Refs #<issue-number>` when the PR is related but does not close the issue.
- Mention any follow-up work that should become a separate issue.

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

Use GitHub Issues for active task tracking and priority order.

Use `TODO_STATUS.md` as a high-level project status snapshot, not the primary backlog.

When completing, deferring, or discovering work, update the relevant section:

- Completed
- In Progress
- Remaining Tasks
- Notes
- Last Updated

Do not mark work complete unless it has actually been done and validated where applicable.

When discovering new actionable work, prefer creating or updating a GitHub issue instead of adding it only to `TODO_STATUS.md`.

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
