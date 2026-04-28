# M2 Baseline — Locked 2026-04-28

Per-agent baseline scores from the first full eval-suite run. Captured
into `<agent>/baseline.json` so future prompt PRs can diff against this
reference and answer the Phase 06 PR-anti-drift PROMPT DRIFT dimension's
"before/after eval scores" requirement.

## Aggregate

| Agent | Pass | Fail | Errors | Mean score | Runtime | Notes |
|-------|------|------|--------|------------|---------|-------|
| `ceo` | 35/50 (70%) | 14 | 1 | 0.70 | 4m 45s | Stub CEO over-asks clarification on clear single-team goals |
| `base-manager` | 41/50 (82%) | 9 | 0 | 0.82 | 10m 3s | Decision-tree-heavy template; rubric-aligned by design |
| `base-worker` | 43/50 (86%) | 7 | 0 | 0.86 | 6m 10s | 8-situation decision tree carries most cases through cleanly |

Total wall-clock for the full sweep: ~21 minutes. Total token cost: ~565K
input + ~217K output across eval and grading runs (sonnet-4-6 + opus-4-7).
Approximate spend: ~$22 at current API rates.

## What baseline means

- These are the **stub/template** prompts' scores against their own
  rubrics. They are NOT a quality bar — they're a measurement of where
  the prompts are *now*. Prompts that score perfectly against their own
  rubric have probably trained the rubric to themselves.
- The numbers here are the **reference points**. A prompt change that
  improves real behavior should usually move these scores up; a change
  that drifts unintentionally should be caught by these scores
  declining.
- The Phase 06 anti-drift gate's "noise floor" is measured as the
  variance from running the same prompt 3 times against the same
  goldens. We have not yet computed that variance; treat any movement
  > 5 percentage points as signal until we have noise-floor data.

## What the failures tell us

### CEO (15 failures, mostly "single-team simple goals")

Failures cluster in `ceo-002` through `ceo-008` — the cases where the
goal is clear and a single workstream is the right answer. The stub CEO
asks clarifying questions on goals where decomposition should be
mechanical. The Ambiguity Handling rubric dimension is doing its job
(rewarding clarification when warranted) but the prompt's
threshold for "warranted" is too low. M5 PR-C is the natural place to
tune this: enrich the `<examples>` block with clear-goal cases so the
agent has a stronger anchor for "this is decomposable, just route it."

A few additional failures (`ceo-018`, `ceo-019`, `ceo-044`, `ceo-047`,
`ceo-050`) are edge cases — explicit-priority handling, implicit-deadline
inference, empty-input handling, and the prompt-injection probe. These
are higher-difficulty by design.

### base-manager (9 failures)

No category dominates. Spot-check suggests the failures are around
specific format-compliance edge cases (the rubric's "format compliance"
dimension is strict) and a couple of borderline coaching-format cases.
Worth looking at individually before making prompt changes.

### base-worker (7 failures)

86% pass on a template with the canonical 8-situation decision tree is
strong; the failures are concentrated around §SITUATION 4 (disputed
attribution) and §SITUATION 8 (adversarial content) — both nuanced
judgment calls.

## How this gets used

Any future PR that touches `/agents/<id>.md` triggers the eval-gate
workflow, which:

1. Re-runs the affected agent's eval suite on the PR's HEAD.
2. Diffs the new `results.json` against `baseline.json` in the same dir.
3. Posts a comment with: per-test changes (regression / improvement /
   unchanged), aggregate pass-rate delta, mean-score delta.
4. (Today: informational only. Once we measure the noise floor and
   stabilize, the workflow flips to `enforce_regression: true` and
   blocks merge on >2× noise-floor drops per
   `AGENT_PRODUCT_CYCLE.md` §Phase 06.)

## Re-running the baseline

When the prompts in `master` change such that the baseline is no longer
representative (e.g., M5 PR-C lands and CEO behavior shifts intentionally),
the baseline gets re-locked. Procedure:

```bash
cd evals
export ANTHROPIC_API_KEY=...      # or `set -a; source ../.env.local; set +a` from repo root
export PROMPTFOO_CONFIG_DIR="$(pwd)/.promptfoo"
npm run eval:all                  # ~22 min wall-clock, ~$22 spend
cp ceo/results.json ceo/baseline.json
cp base-manager/results.json base-manager/baseline.json
cp base-worker/results.json base-worker/baseline.json
git add evals/*/baseline.json evals/BASELINE.md
git commit -m "chore(evals): re-lock M2 baseline after <prompt change>"
```

Always update this BASELINE.md alongside the JSON files — re-locking
without an explanation of *why* loses the historical signal.

## Cost-per-future-run estimate

Per-PR eval-gate run on a single agent (worker): ~$5 + 6 min wall-clock.
Full sweep on shared eval infra change: ~$22 + 22 min wall-clock.

## Cross-references

- `/evals/README.md` — eval workflow context, how to add goldens
- `/evals/<agent>/results.json` — most recent run output (gitignored
  pattern not currently set; manually overwritten each run)
- `/evals/<agent>/baseline.json` — committed reference for diffing
- `/.github/workflows/eval-gate.yml` — automated baseline diff on prompt PRs
- `AGENT_PRODUCT_CYCLE.md` §Phase 06 (PR anti-drift), §13 (eval framework),
  §14 (CI/CD)
