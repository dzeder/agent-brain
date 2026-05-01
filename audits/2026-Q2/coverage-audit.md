# Q2 2026 Coverage Audit — `AGENT_PRODUCT_CYCLE.md` vs. brain repo

**Audit date:** 2026-04-30
**Auditor:** dzeder (with automated assist)
**Manual reviewed:** `AGENT_PRODUCT_CYCLE.md` at commit `ad3a275` (2,628 lines)
**Scope:** Verify the brain repo (`bilbao-v2`) materialises every artifact, registry, schema, runbook, workflow, env var, and process the operating manual prescribes. Identify gaps, ambiguities, and reasonable additions beyond the manual.
**Method:** Section-by-section walk of the manual, two parallel codebase explorations, direct verification of all S1 claims with line-number citations.

> **How to read this:** "Covered" means the artifact exists at the correct path with the right shape. "Partial" means it exists but is incomplete, ambiguous, or scaffolded-only. "Missing" means the manual prescribes it and the repo lacks it. "N/A" means the manual permits absence at this stage (e.g. no incidents → no postmortems).

---

## 1. Section-by-section coverage

| Manual area | Repo path | Status | Notes |
|---|---|---|---|
| §3 Repo Architecture: top-level dirs | `/agents`, `/registry`, `/schemas`, `/skills`, `/evals`, `/security`, `/standards`, `/docs`, `/prompts`, `/coaching`, `/audits`, `/context` | ✅ Covered | All 12 prescribed dirs present. |
| §3 Human Principal env vars | `.env.example` lines 29–32 | ✅ Covered | `HUMAN_PRINCIPAL_PRIMARY/BACKUP/TIMEZONE/SLACK_ID` all present with policy comments. |
| §4 Tooling Stack: Anthropic Managed Agents header | `.env.example` line 24 | ✅ Covered | `MANAGED_AGENTS_BETA_HEADER` defined. |
| §Model Selection Strategy | `.env.example` lines 4–13; `/standards/model-selection.md` | ✅ Covered | All 5 model env vars + `DEV_MODEL_OVERRIDE` defined; standard doc present. |
| §Prompt Engineering | `/standards/prompt-engineering.md` | ✅ Covered | Standard doc present. |
| §API-First Design / MCP Registry | `/registry/mcp-servers.json` | 🟡 Partial | Scaffolded but empty. Acceptable until first product MCP server lands; flag for revisit when product-alpha onboards. |
| §Inter-Agent Communication: 4 canonical schemas | `/schemas/agents/message-envelope/v1.0.0.json`, `/schemas/agents/health-report/v1.0.0.json`, `/schemas/workers/signed-output/v1.0.0.json`, `/schemas/workers/reflection/v1.0.0.json` | ✅ Covered | All four canonical schemas at the prescribed `/<domain>/<id>/v<semver>.json` path. |
| §Schema resolver index | `/schemas/registry.json` | ✅ Covered | Resolver index exists. |
| §Git & Versioning Strategy | `.github/PULL_REQUEST_TEMPLATE.md`, `/agents/*/v1.0.0.md` | ✅ Covered | Semantic versioning visible in agent prompt filenames; PR template enforces version bumps. |
| §10 The Self-Improvement Loop — coaching history | `/coaching/<agent-id>/history.md` | 🟡 Partial | Directory + README exist; per-agent files missing. `agents.json` references `/coaching/pr-reviewer/history.md` and `/coaching/ceo/history.md` but neither file is initialized. See S1-7. |
| §10 Nightly autodream | (no spec file) | 🔴 Missing | TODO. See S1-4. |
| §11 Agent Hiring & Onboarding — registry fields | `/registry/agents.json` | ✅ Covered | Required fields (name, version, layer, owner, scope, trust_level, model, worker_type) all present on all four entries. |
| §11 Layer assignment + worker_type | `/registry/agents.json` | ✅ Covered | `layer` and `worker_type` populated correctly (or null for non-workers). |
| §12 Skill Registry | `/registry/skills.json` | ✅ Covered | 3 skills with full required fields. |
| §12 Skill Definition (`SKILL.md` per skill) | `/skills/*/SKILL.md` | ✅ Covered | All 3 skills have `SKILL.md`. |
| §12 `/skills/deprecated/` | (does not exist) | ✅ N/A | Acceptable until first deprecation. |
| §13 Eval Framework — golden datasets ≥50 examples | `/evals/base-worker/tests.yaml`, `/evals/base-manager/tests.yaml`, `/evals/ceo/tests.yaml` | ✅ Covered | Verified: 50 / 50 / 50 cases per agent. Meets manual line 1863 minimum. |
| §13 Eval rubrics (4) | `/evals/rubrics/{worker-output,manager-decomposition,manager-review,ceo-orchestration}-rubric.md` | ✅ Covered | All 4 rubrics present. |
| §13 LLM-as-judge | `/evals/judge-prompts/rubric-judge.txt` | ✅ Covered | Uses `claude-opus-4-7` per `MODEL_EVAL`. |
| §13 Adversarial test prompts | `/evals/adversarial/README.md` (empty corpus) and `/security/injection-corpus/vectors.yaml` (390 lines) | 🟡 Partial | Two locations, ambiguous split. See S2-8. |
| §14 Standards (security, prompts, models, comms) | `/standards/{security,prompt-engineering,model-selection,inter-agent-comms}.md` | ✅ Covered | All four present. |
| §15 Security: STRIDE | `/security/stride-template.md` | ✅ Covered | Template present. |
| §15 Security: injection corpus | `/security/injection-corpus/vectors.yaml` | ✅ Covered | 390 lines of vectors. |
| §15 Security: log scrubbing | `/security/log-scrubbing/{patterns.yaml,test-cases.md}` | ✅ Covered | Patterns + tests present. |
| §15 Security: coaching-loop threat model + checklist | `/security/threat-models/coaching-loop.md`, `/security/coaching-review-checklist.md` | ✅ Covered | Closes CLAUDE.md "known gap #1" architectural enforcement gap at the policy layer. |
| §16 Portable Context Files | `/context/{Daniel,Ohanafy,STACK,CONSTRAINTS}.md` | ✅ Covered | All four files present and human-maintained. |
| §16 Decision Registry (Notion) | (no in-repo runbook) | 🔴 Missing | External system; manual schema at lines 2000–2024 has no companion runbook in `/docs/runbooks/`. See S1-6. |
| §16 Daily digest (7am, n8n + CEO) | (no spec file) | 🔴 Missing | Manual line 2101 prescribes; no `/docs/runbooks/` entry or n8n config. See S1-5. |
| §16 Weekly digest (Mon 8am) | (no spec file) | 🔴 Missing | Same as above. See S1-5. |
| §16 `/explain` Slack command | (TODO) | 🔴 Missing | Manual line 2072 explicitly TODO; CLAUDE.md "Things not yet built". See S1-2. |
| §17 Telemetry — Langfuse traces | (external; no runbook) | 🔴 Missing | External system pointer. See S1-6. |
| §17 Datadog dashboards | (external; no runbook) | 🟠 Contradiction | Manual line 2137: "Datadog is not in this stack." Manual line 2148: "Error & Coaching Dashboards (Datadog)". The manual contradicts itself. See S2-11. |
| §17 Monday.com agent health board | (external; no runbook) | 🔴 Missing | External system pointer. See S1-6. |
| §18 Agent Org Docs / `agents.json` source of truth | `/registry/agents.json` line 3 `last_updated` | ✅ Covered | Manual line 2178 satisfied. |
| §18 ADRs | `/docs/adr/001-brain-repo-architecture.md` | ✅ Covered | At least one ADR exists. |
| §18 Postmortems | `/docs/postmortems/README.md` | ✅ N/A | Empty; acceptable, no incidents. |
| §18 Prompts versioned | `/agents/<role>/<id>-v<semver>.md` and `/prompts/<agent-id>/examples/library.md` | 🟡 Partial | Active agent prompts are filed under `/agents/`, not `/prompts/<agent-id>/<agent-id>-v<semver>.md` as CLAUDE.md says. See S2-10. |
| §Doc Maintenance — quarterly audits | `/audits/` | 🟡 Partial | This file fixes Q2 2026. Q1 2026 still missing. See S1-1. |
| §Doc Maintenance — README completeness check | `README.md` | 🟡 Partial | Verify the prompts at manual line 2381 are surfaced in README; spot-check shows README links to manual but does not include the review prompts inline. |
| §Monitoring Stack — ingestion pipeline | (no spec file) | 🔴 Missing | Manual lines 2438–2446 explicit TODO. See S1-3. |
| §PR Anti-Drift Checklist | `.github/PULL_REQUEST_TEMPLATE.md` | ✅ Covered | Template enforces intent, prompt version, eval delta, security drift, escalation, Linear link. |
| `.github/CODEOWNERS` | `.github/CODEOWNERS` | ✅ Covered | Sensitive paths protected; `/registry/` added per commit `b373dfd`. |
| `.github/workflows/` | `eval-gate.yml`, `pr-review.yml`, `linear-link-check.yml` | ✅ Covered | All three workflows present. |
| `.github/dependabot.yml` | Yes (commit `8fc8564`) | ✅ Covered | Dependency updates configured. |
| Root: `.env.example` | Present | ✅ Covered | Doppler-only policy; covers Models, Feature Flags, Runtime, Human Principal, Linear. |

**Tally:** 30 covered · 6 partial · 7 missing · 2 N/A · 1 manual-internal contradiction.

---

## 2. Severity-ranked findings

### S1 — Manual prescribes, repo lacks (real gaps)

| # | Finding | Manual citation | Why it matters |
|---|---|---|---|
| **S1-1** | **Q1 2026 audit artifact missing.** | Lines 2388–2399 ("A missing audit file is a visible gap, not a silent skip") | The audit window has closed; absence is itself a finding. Filing this Q2 audit covers Q2 only. |
| **S1-2** | **`/explain` Slack command not built.** No spec file, no ADR, no entry in `/registry/`. | Lines 2072–2085 (explicit TODO) | Manual mandates retrieval-layer build before registry exceeds 200 records. Without it, `/explain` returns nothing and decisions become un-queryable at scale. |
| **S1-3** | **Knowledge / monitoring ingestion pipeline not built.** | Lines 2438–2446 (explicit "Build status: this is a separate system that needs to be built") | No mechanism for the system to track Claude Code releases, Anthropic notes, or community skill updates. CLAUDE.md "Things not yet built" item #3. |
| **S1-4** | **Nightly autodream n8n workflow not specified.** | Lines 1157, 1590, 1725–1727 | This is the workflow that batch-writes worker reflections to `/coaching/<agent-id>/history.md` and snapshots CEO state for crash recovery. Without it, coaching history never accumulates and the CEO recovery story is broken. |
| **S1-5** | **n8n workflow specs absent across the board.** None of: daily digest (line 2101), weekly digest (line 2099), CEO 15-min health ping (line 1592), support→coaching pipeline, quarterly-audit scaffolder (line 2399), decision-registry write hooks (line 2025). | Lines 1592, 1725, 2025, 2099–2107, 2399 | The manual treats these as required automations. Without spec files in repo, the n8n configuration is undiscoverable from source. Recommend `/docs/runbooks/n8n/` with one file per workflow. |
| **S1-6** | **External-system pointers missing.** No in-repo runbook for: Notion decision registry, Langfuse trace store, Monday.com agent-health board, Datadog dashboards, Granola meeting-decision linkage, Sentry, Grafana, Postgres logs. | Lines 540 (Langfuse), 547–553 (Notion), 567 (Monday.com), 1981, 2137, 2148, 2156 | The manual treats these stores as authoritative; the repo has no setup runbooks pointing at them. New engineers cannot reach them from the codebase. See "Beyond the manual" §3 for proposed remediation. |
| **S1-7** | **`/coaching/<agent-id>/history.md` scaffolds missing.** | Manual line 2580 (STEP 02: append-only); `agents.json` lines 22, 47 reference these files. | "Append-only" is undefined when the file doesn't exist yet. Scaffold with header (agent_id, format spec, last_appended) before activation, not at first incident. |

### S2 — Ambiguity / structural duplication (decide & document)

| # | Finding | Notes |
|---|---|---|
| **S2-8** | **Adversarial test corpus has two homes.** Manual root §"What belongs here" lists "adversarial test prompts"; the repo has both `/evals/adversarial/README.md` (empty) and `/security/injection-corpus/vectors.yaml` (390 lines). Resolve: are these eval-time-only vs. runtime-defense corpora, or duplication? Document the split or consolidate. |
| **S2-9** | **`/skills/registry.json` is a self-described "co-located duplicate"** (per `/registry/skills.json` description line 1). Either delete or document as canonical mirror with a sync rule and CI check. |
| **S2-10** | **`/prompts/` vs. `/agents/` split.** CLAUDE.md says prompts live at `/prompts/<agent-id>/<agent-id>-v<semver>.md`; in practice agent prompts live at `/agents/orchestration/ceo-v1.0.0.md` etc. and `/prompts/<agent-id>/examples/library.md` only holds example libraries. Reconcile by either (a) moving agent prompts under `/prompts/` or (b) updating CLAUDE.md to match the chosen structure. |
| **S2-11** | **Manual-internal contradiction on Datadog.** Line 2137: "Datadog is not in this stack." Line 2148: "Error & Coaching Dashboards (Datadog)". One of these must change. Recommend resolving in favour of line 2137 (Langfuse + Sentry + Grafana cover the dashboards) and renaming the §17 subsection. |

### S3 — Acceptable-as-is

| # | Finding |
|---|---|
| **S3-12** | `/registry/mcp-servers.json` and `/registry/index.json` empty — fine until first product repo lands. Add a CI check that gates emptiness against `/registry/index.json` having any product entries. |
| **S3-13** | `/docs/postmortems/` empty — fine; no incidents. |
| **S3-14** | `/skills/deprecated/` does not exist — fine until first deprecation. |
| **S3-15** | `README.md` references the manual but does not inline the §Doc Maintenance review prompts (line 2381). Optional: add a "How to review this repo" section. |

---

## 3. Recommended remediation order

Don't try to fix everything at once. Open one Linear issue per S1 finding; sequence by leverage.

1. **S1-7 (coaching scaffolds)** — 30-minute fix; unblocks PR-Reviewer activation. Just create two `history.md` files with header.
2. **S1-5 + S1-6 (n8n + external pointers)** — Single PR adds `/docs/runbooks/external-systems.md` (cf. §"Beyond the manual" §3) and `/docs/runbooks/n8n/{daily-digest,weekly-digest,ceo-health-ping,nightly-autodream,quarterly-audit-scaffolder,support-to-coaching}.md`. Spec only, not implementation. Closes 6 documentation gaps in one stroke.
3. **S1-4 (nightly autodream implementation)** — After spec lands, build the actual n8n workflow. Required for any worker reflections to persist. Highest dependency: blocks meaningful coaching loop.
4. **S1-2 (`/explain` Slack command)** — Defer until decision registry has ≥50 records (manual line 2076). Spec the retrieval layer first; build when needed.
5. **S1-3 (monitoring pipeline)** — Lowest urgency; nothing in the system depends on it yet.
6. **S1-1 (Q1 2026 audit)** — File a backfill `audits/2026-Q1/` with a one-line note: "no audit performed in window; first audit performed 2026-Q2 — see ../2026-Q2/coverage-audit.md" rather than fabricating retroactive findings.

S2 findings can ride along with whichever S1 fix touches the same area (e.g. S2-10 and S2-11 in a "manual + structure cleanup" PR).

---

## 4. "Then some" — recommended additions beyond the manual

These are not required by `AGENT_PRODUCT_CYCLE.md` but would strengthen the platform.

1. **CI coverage check.** Add `.github/workflows/coverage-check.yml` that diffs a `/registry/coverage-manifest.json` (extracted from the manual, owned by `human-principal`) against the actual repo on every PR. Fails if any S1-class artifact disappears. Prevents silent drift.
2. **External-systems index** at `/docs/external-systems.md` listing every external store the manual depends on, with: account/workspace identifier, owner, setup runbook link, secrets reference, what would break if it went down. Today this knowledge is scattered across the manual; one consolidated index is the right entry point for new engineers.
3. **Trust-level enforcement table** as `/standards/trust-levels.md`. The manual prescribes trust levels in prose; a checked-in table makes them queryable.
4. **Prompt-cache policy doc** at `/standards/prompt-caching.md`. `FEATURE_PROMPT_CACHING` is defined in `.env.example` but breakpoint placement guidance lives nowhere. Cache misconfiguration silently destroys cost guarantees.
5. **Hiring-checklist runbook** at `/docs/runbooks/agent-hiring.md` — a fillable template derived from §11. Hiring an agent should produce a checked-in artifact, not be a memory test.
6. **Decision-registry mirror schema** at `/schemas/registry/decision/v1.0.0.json`. The Notion schema is described in prose at manual lines 2000–2024; mirror it as JSON Schema so writes from CEO/managers can be validated client-side.
7. **`audit-coverage` script** at `/scripts/audit-coverage.sh` that runs the verifications in §6 below — turns this audit from manual labour into a one-command refresh.

---

## 5. What this audit does not do

- Does not build any of the missing artifacts. Each S1 finding gets its own Linear issue and PR.
- Does not re-litigate any decision in CLAUDE.md's "decisions already made" table.
- Does not audit product repos — only the brain repo. Product-repo audits are scoped to those repos under their own `/audits/` trees.
- Does not score eval performance — that's the eval-gate workflow's job, not this audit's.

---

## 6. Verification appendix — how to re-run this audit

Run from repo root:

```bash
# 1. Confirm all 12 prescribed top-level dirs exist
for d in agents registry schemas skills evals security standards docs prompts coaching audits context; do
  [ -d "$d" ] || echo "MISSING: $d"
done

# 2. Confirm 4 canonical schemas exist
for f in schemas/agents/message-envelope/v1.0.0.json \
         schemas/agents/health-report/v1.0.0.json \
         schemas/workers/signed-output/v1.0.0.json \
         schemas/workers/reflection/v1.0.0.json; do
  [ -f "$f" ] || echo "MISSING: $f"
done

# 3. Confirm golden eval datasets meet 50-case minimum
for a in base-worker base-manager ceo; do
  n=$(grep -c "^- description:" "evals/$a/tests.yaml")
  [ "$n" -ge 50 ] || echo "UNDER 50: evals/$a/tests.yaml ($n cases)"
done

# 4. Confirm registry agents have required fields
jq '.agents[] | select(has("layer") and has("owner") and has("scope") and has("trust_level") and has("model") | not) | .agent_id' registry/agents.json
# Expected output: empty

# 5. Confirm coaching scaffolds exist for STUB agents in registry
jq -r '.agents[] | select(.coaching_history != null) | .coaching_history' registry/agents.json | \
  while read p; do [ -f ".${p}" ] || echo "MISSING: .${p}"; done

# 6. Confirm .env.example covers all required env vars from CLAUDE.md
for v in MODEL_CEO MODEL_MANAGER MODEL_WORKER_COMPLEX MODEL_WORKER_SIMPLE MODEL_EVAL \
         HUMAN_PRINCIPAL_PRIMARY HUMAN_PRINCIPAL_BACKUP HUMAN_PRINCIPAL_TIMEZONE \
         HUMAN_PRINCIPAL_SLACK_ID MANAGED_AGENTS_BETA_HEADER; do
  grep -q "^$v=" .env.example || echo "MISSING ENV: $v"
done
```

A clean run (no output) means the S1 baseline is intact. A failure points at the specific drift.

---

**Next audit:** 2026-Q3 (target window: 2026-07-01 → 2026-07-31). Diff against this file. Open a Linear issue at the start of Q3 to schedule.
