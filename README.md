# agent-brain

The platform repo. It sets engineering standards, houses shared infrastructure,
and runs the one Orchestration Agent (CEO) with visibility across all products.

This is **not** a product repo. Product repos (`product-alpha`, `product-beta`,
etc.) extend the standards defined here — they never redefine them. When in
doubt about whether something belongs here or in a product repo: put it in the
product repo. Promote here only when useful to 2+ products.

## Start here

- [`AGENT_PRODUCT_CYCLE.md`](./AGENT_PRODUCT_CYCLE.md) — the operating manual.
  Source of truth for every architectural decision. Read the relevant section
  before making any decision in this repo.
- [`CLAUDE.md`](./CLAUDE.md) — project instructions for AI agents working in
  this repo. Read first if you're a coding agent.
- [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md) —
  the PR Anti-Drift gate every change passes through.

## Repo layout

```
/agents/orchestration/   ← CEO agent (one, lives here)
/agents/managers/        ← Base manager templates
/agents/workers/         ← Base worker templates
/context/                ← Portable context files (human-maintained)
/schemas/                ← Canonical JSON schemas, /schemas/<domain>/<id>/v<semver>.json
/skills/                 ← Shared skills (2+ products)
/evals/                  ← Shared rubrics, adversarial prompts, Promptfoo harness
/registry/               ← agents.json, skills.json, mcp-servers.json, index.json
/security/               ← STRIDE templates, injection corpus, red-team library
/standards/              ← Extracted standard documents
/docs/adr/               ← Architectural decision records
/docs/postmortems/       ← Incident post-mortems
/audits/                 ← Quarterly audit artifacts: /audits/YYYY-Qn/<type>.md
/coaching/               ← Per-agent coaching history: /coaching/<agent-id>/history.md
/prompts/                ← Versioned prompts: /prompts/<agent-id>/<agent-id>-v<semver>.md
```

## Quick start — running evals

The eval harness is the only runnable component in this repo today. It uses
[Promptfoo](https://promptfoo.dev) with `claude-opus-4-7` as the LLM-as-judge
(see `AGENT_PRODUCT_CYCLE.md` §13).

```bash
cd evals
npm install                  # one-time; pins promptfoo
export ANTHROPIC_API_KEY=...  # source from Doppler in production
npm run eval:all             # full sweep: ceo + base-manager + base-worker
npm run view                 # open the Promptfoo UI on the latest run
```

Cost expectation, baseline workflow, and how to add a golden are documented in
[`evals/README.md`](./evals/README.md).

## Contributing

Every PR must:

- Include a one-paragraph intent statement and map to a Linear/Jira issue
- Pass the [PR Anti-Drift template](./.github/PULL_REQUEST_TEMPLATE.md) checklist
- Include before/after eval scores if any prompt changed

Changes to `/agents/pr-reviewer/`, `/standards/`, or `CLAUDE.md` require
human-principal manual review regardless of the automated gate result.

Full PR rules: [CLAUDE.md → "Every PR must"](./CLAUDE.md#every-pr-must).

## Status — what's not yet built

These are specced in `AGENT_PRODUCT_CYCLE.md` but not implemented. Do not
pretend they exist:

- PR review agent (`/agents/pr-reviewer/`)
- `/explain` Slack command
- Nightly autodream n8n workflow
- Knowledge ingestion pipeline
- Synthetic data generator (must be built before any dev work in product repos)
- Security artifacts (`/security/` STRIDE templates, injection corpus,
  red-team library)

Known architectural gaps that are real limitations — not yet resolved — are
listed in [`CLAUDE.md` → "Known gaps"](./CLAUDE.md#known-gaps-acknowledged-not-yet-resolved).

## Environment variables

Never hardcode model strings or credentials. See
[`.env.example`](./.env.example) for the full list. Never create a `.env` file
in this repo.

## License

MIT — see [LICENSE](./LICENSE).
