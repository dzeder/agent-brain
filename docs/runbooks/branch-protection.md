# Branch Protection Runbook

How master is locked down on `agent-brain`, what each rule does, how to
override when truly needed, and how to triage automated alerts. Read this
before changing branch protection or before approving a PR that you'd
rather have just merged through.

This runbook is the canonical "how the gates on master work" reference
for any agent or human in the brain repo. It pairs with the broader
[approval-flow runbook](./approval-flow.md), which explains *what to do*
when the `pr-review-agent` returns `escalate`.

## What's protected on `master`

Configured via `gh api -X PUT repos/dzeder/agent-brain/branches/master/protection`.
Verify current state with:

```bash
gh api repos/dzeder/agent-brain/branches/master/protection --jq '{
  required_checks: .required_status_checks.contexts,
  approving_count: .required_pull_request_reviews.required_approving_review_count,
  codeowner_review: .required_pull_request_reviews.require_code_owner_reviews,
  dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews,
  linear_history: .required_linear_history.enabled,
  conversation_resolution: .required_conversation_resolution.enabled,
  enforce_admins: .enforce_admins.enabled,
  allow_force_pushes: .allow_force_pushes.enabled,
  allow_deletions: .allow_deletions.enabled
}'
```

Current rules:

| Rule | Setting | Why |
|---|---|---|
| `required_status_checks.contexts` | `pr-review-agent`, `linear-link` | Both gates must pass before merge. `pr-review-agent` enforces the eight anti-drift dimensions; `linear-link` enforces "no orphan changes." |
| `required_status_checks.strict` | `true` | PR must be up to date with master before merging. |
| `required_pull_request_reviews.required_approving_review_count` | `1` | One human approval required. The human can be `@dzeder` (admin self-approve is a deliberate click). |
| `required_pull_request_reviews.require_code_owner_reviews` | `true` | PRs touching paths in `.github/CODEOWNERS` need approval from the listed owner. |
| `required_pull_request_reviews.dismiss_stale_reviews` | `true` | Pushing new commits invalidates prior approvals. |
| `required_linear_history` | `true` | Squash-merge only on master; matches existing repo style. |
| `required_conversation_resolution` | `true` | Agent comments and human review threads must be resolved before merge. |
| `enforce_admins` | `false` | Admin can bypass when truly needed (see "When to bypass" below). |
| `allow_force_pushes` | `false` | No history rewrites on master. |
| `allow_deletions` | `false` | Master cannot be deleted. |

## Repo-level security toggles

Configured via `gh api -X PATCH repos/dzeder/agent-brain` and the
`/vulnerability-alerts` and `/automated-security-fixes` endpoints. Verify:

```bash
gh api repos/dzeder/agent-brain --jq '{
  delete_branch_on_merge,
  secret_scanning: .security_and_analysis.secret_scanning.status,
  push_protection: .security_and_analysis.secret_scanning_push_protection.status
}'

gh api repos/dzeder/agent-brain/vulnerability-alerts -i | head -1   # expect 204
```

Current settings:

| Setting | Value | Why |
|---|---|---|
| `delete_branch_on_merge` | `true` | Keeps branch list clean after merges. |
| `secret_scanning` | `enabled` | GitHub scans pushed code for known secret patterns. |
| `secret_scanning_push_protection` | `enabled` | Pushes containing real-looking secrets are *rejected at push time*, not just flagged after. |
| Vulnerability alerts | enabled | Dependabot opens issues for vulnerable deps. |
| Automated security fixes | enabled | Dependabot opens PRs to patch vulnerable deps. |

## How a normal PR flows under this protection

1. **Open PR** → `pr-review-agent` and `linear-link` workflows run.
2. **`linear-link` fails** if no `linear.app/.../issue/TEAM-NUM` URL in body
   and no `no-linear` label. Add the URL or apply the label
   (foundational/pre-Linear work). Workflow re-runs on the `edited` /
   `labeled` event.
3. **`pr-review-agent` returns `pass` / `fail` / `escalate`** based on the
   eight anti-drift dimensions. If `escalate`, follow
   [approval-flow.md](./approval-flow.md) — surface the approval card in
   chat, do not punt the human to the GitHub UI.
4. **Both checks green + 1 approval + Code Owner review (if applicable)**
   → merge button enables.
5. **Squash-merge** → branch auto-deletes, master moves forward in linear
   history.

## When to bypass (`gh pr merge --admin`)

Bypass is for situations where the gate is *clearly* the wrong answer and
holding the merge is *more* harmful than the bypass. It is logged in the
PR timeline ("merged without waiting for review" / "merged with failing
checks"). Bypasses include:

- The gate is broken (e.g., `pr-review-agent` workflow itself has a bug)
  and you've opened the fix in another PR.
- A production incident requires an immediate revert and the gate
  blocks the safety hatch.
- The gate is correctly red but the human has already done the review
  the gate would have asked for, and applying the bypass label would
  cost more time than it saves (this is the `pr-review-bypass` label
  *vs* admin-merge tradeoff — bypass label is preferred when possible).

Bypass is *not* for: avoiding template work, skipping review on a
"trivial" change, late-night convenience, or "I'll fix the gate later."
Each bypass should be documented in the PR comment thread with the
reason — that's the audit trail.

If you find yourself bypassing more than ~once a week, the gate is
probably miscalibrated. Open an ADR or a tightening PR rather than
normalizing the override.

## Recursion rule and CODEOWNERS

Some paths require Code Owner review *and* return `verdict: escalate`
from the `pr-review-agent`. They form a double-gate for constitutional
changes:

| Path | In CODEOWNERS | In pr-reviewer recursion rule |
|---|---|---|
| `/CLAUDE.md` | ✅ | ✅ |
| `/AGENT_PRODUCT_CYCLE.md` | ✅ | ✅ |
| `/standards/` | ✅ | ✅ |
| `/agents/pr-reviewer/` | ✅ | ✅ |
| `/.github/` | ✅ | (subset — workflows touch sometimes escalate) |
| `/.github/CODEOWNERS` | ✅ | ✅ (it's CODEOWNERS itself) |
| `/registry/` | ✅ | (no — agent reads but doesn't escalate) |
| `/LICENSE` | ✅ | (no) |

PRs touching the recursion-rule paths *will always* return `escalate`,
even when the content is clean. This is by design: the agent has no
authority to approve changes to its own operating context. Surface in
chat per [approval-flow.md](./approval-flow.md).

## Triaging alerts

### Secret-scanning alert

GitHub will surface the alert in the repo's Security tab and (if
configured) email the owner. Triage:

1. **Confirm the secret is real.** Some patterns produce false positives
   (e.g., `AKIAIOSFODNN7EXAMPLE` is the AWS docs example).
2. **If real:** rotate the secret immediately at the source (AWS
   console, Anthropic dashboard, etc.), then close the alert with reason
   "revoked." The leaked credential remains in git history forever.
3. **If false positive:** close the alert with reason "false positive"
   and add the pattern to a `.gitleaks.toml` or repo-level allowlist if
   it'll recur.

Push protection should make this rare — secret patterns are blocked
*at push time* on push to any branch, including PR branches.

### Dependabot alert / PR

Each Dependabot PR runs through `pr-review-agent` and `linear-link`:

- `pr-review-agent` will likely return `escalate` for PRs touching
  `agents/pr-reviewer/package.json` (recursion rule). Surface in chat
  per approval-flow.
- `linear-link` will fail (Dependabot doesn't write Linear URLs). Apply
  `no-linear` label to clear it.

After the gates: review the changelog of the bumped dep, especially for
patches with security advisories. Merge if non-breaking; hold if the
release notes call out behavior changes that would touch the
pr-reviewer's prompt or the eval harness.

## Rollback

Full rollback of branch protection is one API call:

```bash
gh api -X DELETE repos/dzeder/agent-brain/branches/master/protection
```

Partial rollback (e.g., temporarily lift `enforce_admins=false` to push
a hotfix) is a `PUT` with a modified config. **Always restore
protection in the same session** — leaving master unprotected is
re-introducing audit gap #1.

To roll back the security-and-analysis toggles:

```bash
gh api -X PATCH repos/dzeder/agent-brain --input - <<'EOF'
{
  "security_and_analysis": {
    "secret_scanning": { "status": "disabled" },
    "secret_scanning_push_protection": { "status": "disabled" }
  }
}
EOF
gh api -X DELETE repos/dzeder/agent-brain/vulnerability-alerts
gh api -X DELETE repos/dzeder/agent-brain/automated-security-fixes
```

These should not be needed under normal operation. Document any
rollback in the PR / incident thread.

## Cross-references

- [`approval-flow.md`](./approval-flow.md) — what to do when
  `pr-review-agent` returns `escalate` (surface in chat, not GitHub).
- [`.github/CODEOWNERS`](../../.github/CODEOWNERS) — the protected-paths
  list driving Code Owner review.
- [`.github/workflows/pr-review.yml`](../../.github/workflows/pr-review.yml)
  — the `pr-review-agent` workflow.
- [`.github/workflows/linear-link-check.yml`](../../.github/workflows/linear-link-check.yml)
  — the `linear-link` workflow.
- [`.github/dependabot.yml`](../../.github/dependabot.yml) — Dependabot
  config that feeds the alert pipeline above.
- [`CLAUDE.md`](../../CLAUDE.md) — the constitutional document whose
  guardrails this runbook makes enforceable.
