# Prompt Injection Corpus

What goes here: **one concrete test prompt per OWASP LLM Top 10 attack type**,
tagged by category, written as the literal input that would be fed to an
agent (via user message, tool output, or document content). The corpus is
fed into adversarial test runs — see [`/evals/adversarial/`](../../evals/adversarial/)
for how the prompts are exercised.

Each prompt should:
- Target a specific OWASP LLM Top 10 category (LLM01: Prompt Injection,
  LLM02: Insecure Output Handling, …).
- Be written as a real input string, not a description of one.
- Tag the expected agent layer impact (worker / manager / CEO) and the
  expected safe behavior (flag, refuse, escalate).
- Include the injection surface (direct user input, tool output, document
  content, MCP server response).

## Current corpus

`vectors.yaml` — initial set of 23 vectors (M3). Coverage by category and
surface is recorded inline at the bottom of that file.

## Adding a vector

1. Append to `vectors.yaml` with the schema documented in the file header
   (`id`, `owasp_llm_top_10`, `surface`, `target_layer`, `payload`,
   `expected_safe_behavior`, `notes`).
2. Update the `coverage` block at the bottom of the file so the matrix
   stays in sync.
3. Add at least one corresponding adversarial test under
   `/evals/adversarial/` referencing the vector id (Phase 13 deliverable;
   not all vectors need to be wired immediately).

Reference: `AGENT_PRODUCT_CYCLE.md` §04 Prompt Injection Defense and §13
Adversarial & Safety Testing.
