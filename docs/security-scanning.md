# Security scanning

The Security scanning workflow runs on Tuesdays at 14:37 UTC on `main` and on manual dispatch. Pull requests run the scans for the files they change. Findings are advisory during the baseline rollout.

- **npm dependency audit** checks the committed lockfile and reports production and build-tool findings. A package can appear in both groups when the lockfile contains separate occurrences.
- **OpenTofu configuration scan** checks tracked Terraform source using bundled Trivy rules. Review rule IDs and resources against the intended infrastructure.
- **GitHub Actions workflow scan** runs zizmor offline against workflow YAML. Review token permissions, checkout credentials, and action pins. The scan uses the checkout token with read-only permissions and does not run deployment or blog notification workflows.

Open each job summary to review findings. Scanner errors fail the job and are labeled separately. Rerun transient errors, and investigate repeated failures before relying on the results. Use separate changes for workflow or infrastructure remediations that affect deployment or notifications.

Drake owns baseline triage and records the severity, affected package or resource, and disposition in [issue #127](https://github.com/drakejrobert-sudo/drakesfood/issues/127) or an appropriate tracking issue. Summaries should contain rule identifiers and locations. Keep raw scanner output, source snippets, and credentials out of public issues and reports.

Dependabot alerts are available in the repository’s **Security** tab. Drake should watch the repository with **Security alerts** or **All Activity** selected and enable a delivery channel in personal settings. Confirm delivery when a new genuine alert arrives. GitHub may show existing alerts without sending a notification for them.

Verify a manual run on `main` and the first weekly run. After baseline review, compare the PR base and proposed merge result using the same tools and rules. Add required checks for newly introduced or escalated high or critical findings after verifying the comparison.
