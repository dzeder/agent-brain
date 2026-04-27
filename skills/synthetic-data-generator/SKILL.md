---
name: synthetic-data-generator
description: >
  Generate N synthetic records matching a target schema for use in eval golden
  datasets, dev-environment fixtures, and adversarial test corpora — without
  exposing real customer data or PII. Inputs: a JSON schema or example record,
  a count, and optional constraints (locale, tone, severity, domain). Outputs:
  N distinct records validated against the schema, plus a manifest documenting
  the seed, model, and diversity profile of the run. Run this skill BEFORE any
  product-repo dev work begins (per CLAUDE.md "Things not yet built") and BEFORE
  expanding any agent's golden dataset past its initial 50 examples. Do NOT use
  this skill to generate red-team / adversarial inputs — those live in
  /security/injection-corpus/ and must be hand-curated.
version: 1.0.0
inputs:
  - schema: /schemas/skills/synthetic-data-generator/input/v1.0.0.json
outputs:
  - schema: /schemas/skills/synthetic-data-generator/output/v1.0.0.json
  - path: <caller-supplied output_path>  # written by the CLI; agent variant returns the records inline
compatible_agent_layers: [worker, manager]
compatible_worker_types: [code_data_transforms, research_synthesis]
tags: [test-data, evals, dev-environment, fixtures, synthetic]
prerequisite: null
out_of_scope:
  - Generating adversarial / red-team inputs (use /security/injection-corpus/)
  - Generating data that resembles a specific real customer or person
  - Generating data containing real or look-alike PII (real-format SSNs, real
    credit cards, real phone numbers, real addresses)
  - Augmenting goldens that have already been used as in-prompt examples
    (contamination rule, per §Prompt Engineering Standards line 208)
---

# Skill: synthetic-data-generator

## Purpose

Produce diverse, schema-valid synthetic records for two consumers:

1. **Eval golden datasets** — when an agent's golden suite needs to grow past
   the initial 50 hand-curated examples, this skill generates additional
   variants while preserving distribution coverage.
2. **Dev-environment fixtures** — product repos cannot use real customer data
   in dev (per §04 Data & Privacy Security). This skill produces stand-in
   records that exercise the same code paths.

The skill is **NOT** an adversarial input generator. Red-team payloads are
hand-curated under `/security/injection-corpus/` because adversarial diversity
is qualitatively different from realistic-distribution diversity — and because
attackers don't generate uniformly.

## When to run

- New product repo standing up (CLAUDE.md "must be built before any dev work")
- An agent's golden suite needs ≥ 10 additional cases for an under-covered
  category
- A new task type is being prototyped and needs realistic input shapes
- Dev environment refresh — replace stale or stale-shaped fixtures
- A schema change has invalidated existing fixtures and they need re-generation

Do NOT run when:
- Real customer data is acceptable for the use case (e.g., post-merge
  monitoring of production traces). Use real data per the data-handling rules.
- Adversarial inputs are wanted (use `/security/injection-corpus/`)
- The output will be used as in-prompt examples AND as goldens (contamination)

## How the skill works

The skill takes:
1. A **target schema** — JSON schema file, OR an example record (from which
   the skill infers a schema).
2. A **count** — `n` records to generate. Recommended range: 10–100 per call.
3. Optional **constraints** — locale, language, tone register, domain, severity
   distribution, time-window for timestamps, presence/absence of optional
   fields.
4. Optional **diversity controls** — e.g., "ensure ≥ 30% have status=blocked",
   "ensure ≥ 5 distinct geographic regions", "ensure ≥ 3 different lengths".
5. Optional **seed** — deterministic re-runs.

The skill produces:
1. An array of `n` records, each validated against the target schema.
2. A **manifest** capturing: model used, seed, constraints, observed
   distribution, and a per-field diversity score (Shannon entropy on
   categorical fields; coefficient of variation on numerical).
3. A **provenance** tag on each record: `synthetic_source: "synthetic-data-generator@1.0.0"`
   so consumers can filter synthetic data out of analytics.

## Procedure

When invoked by an agent, follow this sequence:

### Step 1 — Validate input

- If `target_schema` is a JSON schema, parse it. Reject if malformed.
- If `target_schema` is an example record, infer a schema using simple type
  inference: required-fields = keys present in the example; types = JS typeof
  with extensions for ISO-8601 strings → date-time format.
- Reject `n > 1000` — request a multi-call workflow instead. Single calls past
  1K records waste tokens and produce mode-collapsed outputs.
- Reject inputs that look like real data: email domains in `outlook.com /
  gmail.com / icloud.com / proton.me` plus a recognizable name pattern;
  real-format US SSNs (NNN-NN-NNNN where prefix is in the valid SSA set);
  real-format credit-card numbers passing Luhn. Real-data inputs go to the
  redaction skill (TODO follow-up), not here.

### Step 2 — Apply diversity guardrails

Before generation, plan the distribution:

- **Categorical fields:** if no diversity control was passed, ensure each
  enumerated value appears at least once across the batch (cap at 30% per
  value). Without this, LLMs collapse to the dominant category.
- **Free-text fields:** request the model to vary length (short / medium /
  long, ~ 20% / 60% / 20%), tone register (terse / neutral / verbose), and
  intent (informational / question / complaint / status-update).
- **Numeric fields:** if range hints are present in schema, sample uniformly
  unless the caller supplied a distribution.
- **Locale:** if a locale list is provided, distribute proportionally.
  Otherwise default to en-US 70%, en-GB 15%, en-AU 5%, mixed-locale 10%.
- **Names:** use a name generator that mixes regions and avoids over-
  representation of any one ethnicity. Never use the names of real public
  figures or real customers seen in the brain repo's `/context/` files.

### Step 3 — Generate via Claude

Construct a single prompt:

```
You are generating <n> synthetic records that conform to the schema below.
Apply these diversity controls: <controls>.
Each record must be syntactically valid JSON, validate against the schema,
and be visibly different from the others in <list of vary-on dimensions>.
Do NOT generate any record that resembles a real person, customer, or
company by name. Do NOT use real-format SSNs, real-format credit cards, or
real phone numbers (use 555-prefixed US numbers, +44 7700 9xxxxx for UK,
etc., per the no-real-PII rule).

Schema:
<JSON schema>

Diversity plan:
<the plan computed in Step 2>

Output format: a JSON array of <n> objects. No prose, no fences.
```

Call `claude-sonnet-4-6` with `temperature: 0.7` (higher than agent runtimes
because diversity is the goal). Max tokens: scale to `n * 800`.

### Step 4 — Validate output

For each generated record:
- JSON parse — discard records that fail.
- Schema validation — discard records that fail.
- PII pattern check using `/security/log-scrubbing/patterns.yaml` — if a
  high-severity match appears (real-format SSN, credit-card number passing
  Luhn, real-looking phone), discard that record. Synthetic data must NOT
  smell like real PII.
- De-duplication — if any two records are byte-identical or have identical
  values across all required fields, discard one.

If after validation the surviving count is `< 0.7 * n`, retry once with
adjusted diversity controls. If still under threshold, return what we have
and surface the under-count in the manifest as a `coverage_gap` warning.

### Step 5 — Compute manifest

For each categorical field, compute the count per enum value and the Shannon
entropy. For each numeric field, compute mean / stddev / range. For free-text
fields, compute length distribution buckets. Surface the manifest alongside
the records.

### Step 6 — Tag and return

Stamp every record with `synthetic_source: "synthetic-data-generator@1.0.0"`
at the top level. Return:

```json
{
  "records": [<array of n synthetic records, each tagged>],
  "manifest": {
    "model": "claude-sonnet-4-6",
    "seed": "<if provided>",
    "requested_count": <n>,
    "generated_count": <count after validation>,
    "constraints": <echoed constraints>,
    "distribution": {<per-field summary>},
    "warnings": ["coverage_gap: …"]
  }
}
```

## Privacy & safety guardrails

These are non-negotiable. Treat as `<constraints>` for the agent invoking
this skill.

- **No real PII patterns.** Real-format SSNs, credit cards, phone numbers,
  emails of real domains-with-real-names, real addresses. Use 555-prefix US
  phones, `example.com` / `example.org` emails, and street names that are
  obviously fake (`123 Test Lane`, `42 Sample Street`).
- **No real-person impersonation.** If a name appears in `/context/[YOUR-NAME].md`,
  `/context/[COMPANY].md`, or any /coaching/<id>/history.md, do not generate
  data referencing that name. The skill reads these files to build a stop-list.
- **No leakage of constraints.** If `/context/CONSTRAINTS.md` mentions a
  competitor, customer, or partner name, do not feature them as the subject
  of generated records (e.g., never generate "complaint about Acme Corp" if
  Acme is named in context as a partner).
- **No injection bait.** Do not generate records that, if used as inputs to
  other agents, would trigger `/security/injection-corpus/` patterns —
  unless the consumer explicitly asks for that and the output goes to
  `/security/injection-corpus/` (in which case use that surface, not this
  skill).

## Output schema (what the skill returns)

See `/schemas/skills/synthetic-data-generator/output/v1.0.0.json` for the
canonical schema. Summary:

```json
{
  "records": [
    {
      "synthetic_source": "synthetic-data-generator@1.0.0",
      "<schema-defined fields>": "..."
    }
  ],
  "manifest": {
    "model": "string",
    "seed": "string | null",
    "requested_count": "integer",
    "generated_count": "integer",
    "constraints": "object",
    "distribution": "object",
    "warnings": "array of strings"
  }
}
```

## Bundled templates

Three pre-baked target schemas live under `templates/`:

| Template | Use case | Schema |
|----------|----------|--------|
| `support-message.json` | Customer support classification / routing eval inputs | message text, channel, tenant_id, locale, urgency-hint |
| `linear-issue.json` | Issue triage / decomposition eval inputs | title, body, labels, project, priority, requester |
| `signed-output.json` | Manager review / coaching eval inputs (worker output the manager will review) | task_id, status, confidence, output, self_assessment, reflection |

Each template has its own diversity profile baked in (e.g., support-message
defaults to a 60/30/10 split across billing/technical/other categories).

## CLI usage (for non-agent contexts)

For batch generation in CI or local dev:

```bash
cd skills/synthetic-data-generator
npm install
export ANTHROPIC_API_KEY=...
node generate.js \
  --template support-message \
  --count 25 \
  --output /tmp/support-messages.json \
  --seed 42
```

Or with a custom schema:

```bash
node generate.js \
  --schema path/to/schema.json \
  --count 50 \
  --constraints '{"locale": ["en-US","en-GB"], "tone": "neutral"}' \
  --output /tmp/records.json
```

The CLI is a thin wrapper around the procedure above. See `generate.js`.

## Eval suite

10+ input/output pairs per template (per §12 Skill Testing) — TODO in
follow-up PR. Skeleton at `evals/`. The eval pairs validate that:
- Every generated record passes schema validation
- Distribution claims in the manifest match the actual records
- No PII patterns leak through
- Diversity guardrails fire (entropy ≥ threshold)

## Lifecycle

- v1.0.0 — initial. Three templates, single-batch generation, basic manifest.
- v1.x.0 — add streaming for `n > 200`; add custom-distribution input.
- v2.0.0 — when a breaking change to input/output schemas ships.

Per §12 line 1841: deprecated skills move to `/skills/deprecated/`, never
deleted.

## After you generate

If the output is going into a golden dataset:

1. Append the records to `/evals/<agent-id>/golden/synthetic/<timestamp>.yaml`
   (synthetic separate from hand-curated).
2. Add a CHANGELOG entry to `/evals/<agent-id>/CHANGELOG.md` citing this
   skill version + run manifest.
3. Re-run baselines on the affected agent before merging — synthetic
   additions can shift the score distribution.

If the output is going into a dev fixture:

1. Save under `<product-repo>/fixtures/synthetic/<schema-name>.json`.
2. Tag the run manifest in `<product-repo>/fixtures/MANIFEST.md`.
3. Never check fixtures into the brain repo — they're product-scoped.
