# Eval Framework Config

[Promptfoo](https://promptfoo.dev) is the chosen eval framework per
`AGENT_PRODUCT_CYCLE.md` §13. Decision recorded: see ADR forthcoming
(Milestone 2).

Per-agent Promptfoo configs live alongside the agent's tests:

- `/evals/ceo/promptfooconfig.yaml`
- `/evals/base-manager/promptfooconfig.yaml`
- `/evals/base-worker/promptfooconfig.yaml`

The shared LLM-as-judge prompt is `/evals/judge-prompts/rubric-judge.txt`.
The shared prompt-loader function is `/evals/lib/build-prompt.js`.

`MODEL_EVAL` is `claude-opus-4-7`; agent runtimes are pinned in each
config. Run instructions and cost expectations are in `/evals/README.md`.

This directory is intentionally thin — the framework plumbing lives next to
the rubrics and goldens it serves, not in a separate config silo.
