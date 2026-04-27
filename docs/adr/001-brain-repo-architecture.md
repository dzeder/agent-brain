# ADR 001 — Brain Repo + Product Repos Architecture

Date: 2026-04-27
Status: Accepted
Decided by: Daniel Zeder (human principal)

## Context

The agent system needs to serve more than one product over time. Each product
has its own domain knowledge, customer data, agent registry, eval datasets,
and runbooks. At the same time, several things must be consistent across
every product: engineering standards (model selection, prompt structure,
inter-agent communication, security), shared infrastructure (the CEO,
shared schemas, shared skills), and the operating manual itself.

A single repo would couple unrelated products together and bloat the context
for every agent. Fully separate repos would lose shared standards and prevent
cross-product learning.

## Decision

Two-tier architecture:

1. **Brain repo** (`agent-brain`, this repo) — the platform. Houses the
   operating manual, engineering standards, the one Orchestration Agent
   (CEO), base manager and worker prompt templates, shared schemas, shared
   skills (used by 2+ products), shared eval rubrics and adversarial
   prompts, master registries, and architecture decision records.

2. **Product repos** (`product-alpha`, `product-beta`, …) — extend the brain
   repo's standards. Each product repo holds its own domain agents, skills
   that apply only to that product, eval golden datasets, runbooks,
   incident postmortems, and customer/data context. Product repos copy the
   PR Anti-Drift template on setup and declare overrides to brain repo
   standards in their `CLAUDE.md`.

3. **One CEO** lives in the brain repo with read access (via GitHub API and
   a read-only scoped token) to every product repo's
   `/registry/agents.json`. The brain repo's `/registry/index.json` lists
   each product registry's location. Cross-product goal routing,
   dependency management, and the daily digest all flow through the single
   CEO.

## Consequences

**Enables:**
- One CEO with cross-product visibility — cross-product goal routing,
  dependency management, and aggregate health are possible.
- Cross-product learning — coaching that works for product A can be
  promoted to a shared skill once it's useful in a second product.
- Standards stay singular — model selection, prompt structure, and security
  practices have one source of truth.
- The brain repo can be governed at a stricter bar than product repos
  (every PR runs the full Anti-Drift gate; PRs touching `/agents/`,
  `/standards/`, or `CLAUDE.md` always require human-principal review).

**Constrains:**
- A "promote it to the brain repo" decision becomes a heavier process than
  a product-internal change — Second-Product Startup Rule applies (skill
  must run in a product for ≥2 weeks, have eval scores, no
  product-specific logic).
- The CEO is a single point of failure across products. Mitigated by the
  documented degraded-operation mode (managers continue executing existing
  queues; new work queues until CEO recovers; 15-minute independent health
  check).
- The "two-product rule" can hold up sharing in early days when only one
  product exists. Mitigated by the foundational scaffolding exception:
  the CEO, base templates, message envelope schema, shared eval rubrics,
  and the operating manual itself all belong in the brain repo from Day
  One.

## Alternatives considered

- **Monorepo for everything.** Rejected: products would couple to each
  other, agent contexts would bloat, and the brain repo's strict governance
  would slow product-internal iteration. The benefit of "one place to
  change" doesn't outweigh the cost of every product PR running through
  brain-repo gates.
- **Fully separate repos with no central platform.** Rejected: no shared
  standards (every product reinvents prompt structure, message envelopes,
  eval rubrics, security checklists), no cross-product learning, and the
  one-CEO design becomes impossible (a CEO-per-product loses cross-team
  visibility, which is exactly the value the CEO layer adds).

## References

- `AGENT_PRODUCT_CYCLE.md` §Repo Architecture
- `CLAUDE.md` — what belongs in this repo
- `/registry/index.json` — master index of product registries
