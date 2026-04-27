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

This is **TODO**. Reference: `AGENT_PRODUCT_CYCLE.md` §04 Prompt Injection
Defense and §13 Adversarial & Safety Testing.
