# Eval Framework Config

[Braintrust](https://braintrustdata.com) or [Promptfoo](https://promptfoo.dev)
are the two options per `AGENT_PRODUCT_CYCLE.md` §13 Evaluation & QA. The
chosen framework's config files (golden dataset references, scoring config,
LLM-as-judge model selection at `claude-opus-4-7`) live in this directory.

This is **TODO** until the first golden dataset is built. Per §13, every
agent needs a minimum of 50 representative examples in
`/evals/<agent-id>/golden/` before optimization begins, and a baseline score
must be established before any prompt change ships through the PR Anti-Drift
gate. See §13 for the full setup requirements (eval dimensions, layer-specific
scoring, adversarial coverage, human eval rubrics).
