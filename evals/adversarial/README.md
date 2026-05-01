# Adversarial Test Prompts

Adversarial test prompts for red-teaming agents live in this directory. Test cases attempt to make workers exceed their defined scope, make managers approve bad worker output, make the CEO take on direct execution, and exploit prompt injection or scope-escalation paths through tool outputs and crafted user inputs.

## How this directory relates to `/security/injection-corpus/`

These two directories work together but serve different audiences. Coverage decisions in one must be reflected in the other.

| | `/security/injection-corpus/` | `/evals/adversarial/` (this directory) |
|---|---|---|
| **Audience** | Security review, threat modelling | Eval pipeline, regression detection |
| **Content** | Raw injection vectors — literal strings | Test cases that exercise vectors against a specific agent |
| **Schema** | OWASP-LLM-Top-10 categorised, by surface (user input / tool output / document / MCP response) — see `vectors.yaml` header | Promptfoo-compatible test definitions, scored by the rubric judge |
| **Versioned with** | The threat model and security standard | The per-agent eval suite under `/evals/<agent-id>/` |
| **Run when** | Quarterly red-team review; schema changes | Every PR touching agent prompts (eval-gate workflow) |

**Rule:** every vector in `/security/injection-corpus/vectors.yaml` should produce at least one adversarial test under `/evals/adversarial/` referencing the vector `id`. Not every vector needs to be wired immediately, but the coverage matrix at the bottom of `vectors.yaml` records which are exercised.

## Status

The first batch of test cases is a Phase 13 deliverable alongside the initial golden datasets. As of 2026-04-30, this corpus is empty. The 23 vectors in `/security/injection-corpus/vectors.yaml` (M3) are the ground truth — wire them into per-agent test cases as agents are activated.

## Adding a test case

1. Pick a vector from `/security/injection-corpus/vectors.yaml`.
2. Author a Promptfoo test under `/evals/adversarial/<agent-id>/<vector-id>.yaml` that injects the payload at the documented surface and asserts the `expected_safe_behavior`.
3. Update the vector's `coverage` row in `vectors.yaml`.
4. Run `npm run eval:all` to confirm the suite still passes the rubric judge.

Reference: `AGENT_PRODUCT_CYCLE.md` §13 Adversarial & Safety Testing.
