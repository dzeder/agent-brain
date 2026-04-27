# Model Selection Strategy

> Extracted verbatim from `AGENT_PRODUCT_CYCLE.md` §Model Selection Strategy.
> Source of truth is the operating manual — update there first, then sync here.

Match the model to the task complexity and call volume. Over-engineering with Opus everywhere is expensive and slow. Under-engineering with Haiku everywhere produces poor reasoning. Route deliberately.

| Layer | Default Model | Reasoning |
|-------|--------------|-----------|
| **Orchestration Agent (CEO)** | `claude-sonnet-4-6` | Complex goal parsing and dependency management, but not so rare that Opus cost is justified. Upgrade to `claude-opus-4-7` only for ambiguous or high-stakes goal decomposition. |
| **Manager Agents** | `claude-sonnet-4-6` | Output review, error analysis, coaching generation — requires strong reasoning. Haiku is not sufficient here. Cost is acceptable at manager call volume. |
| **Worker Agents (complex)** | `claude-sonnet-4-6` | Code synthesis, complex data transformation, multi-step reasoning. Default for most workers. |
| **Worker Agents (high-volume / simple)** | `claude-haiku-4-5` | Data extraction, format conversion, classification, simple lookups. High call volume makes Sonnet cost prohibitive. |
| **Eval / Red Team** | `claude-opus-4-7` | Evaluation quality directly determines system quality. Do not cut corners here. Opus catches failure modes Sonnet misses. |
| **Local dev / sandbox** | `claude-haiku-4-5` | Fast feedback, low cost. Never block developer iteration on model latency or cost. |

**Model routing rules:**
- Never hardcode a model string in agent logic. Always reference an environment variable or config key.
- `MODEL_CEO`, `MODEL_MANAGER`, `MODEL_WORKER_COMPLEX`, `MODEL_WORKER_SIMPLE`, `MODEL_EVAL`
- This means model upgrades are a config change + eval run, not a code change.
- Pin the full model string including the date stamp at adoption time (e.g., `claude-sonnet-4-5-20250929`). The short-form strings in this document (`claude-sonnet-4-6`, `claude-haiku-4-5`) are role placeholders — replace them with the actual versioned strings from the [Anthropic release notes](https://docs.anthropic.com/en/release-notes) at adoption and on each upgrade.
- Model upgrade process (proactive): run full eval suite on new version → diff results → human-principal sign-off → config change → canary → promote.
- Model upgrade process (forced deprecation): when Anthropic announces EOL with a fixed timeline, run full eval suite on all viable replacement models → if best replacement shows regression, document the delta, notify human principal, and adjust golden dataset or prompts before migrating. If no viable upgrade exists with acceptable eval scores, escalate to architectural review — do not migrate blind.

**Extended thinking — use it selectively:**

| Use case | Extended thinking | Reasoning |
|----------|------------------|-----------|
| CEO goal parsing (ambiguous inputs) | ✅ Yes | Reasoning quality compounds downstream. Thinking tokens here save correction tokens later. |
| Security threat modeling | ✅ Yes | STRIDE analysis benefits from deliberate reasoning chains. Surface more attack vectors. |
| Manager coaching analysis | ✅ Yes (when pattern is unclear) | When a worker error pattern is ambiguous, extended thinking surfaces better root cause. |
| Manager output review (routine) | ❌ No | Routine review against a rubric does not need extended thinking. Adds latency for no gain. |
| Worker task execution | ❌ No | Workers execute against specs. Extended thinking overhead is not justified for routine tasks. |
| Eval scoring | ✅ Yes | LLM-as-judge quality matters. Extended thinking produces more calibrated scores. |
