# Prompt Engineering Standards

> Extracted verbatim from `AGENT_PRODUCT_CYCLE.md` §Prompt Engineering Standards.
> Source of truth is the operating manual — update there first, then sync here.

These standards apply to every system prompt in the hierarchy. Inconsistency in prompt structure creates inconsistency in behavior.

## Structure

Every system prompt follows this order:

```
1. Identity & Role       — who this agent is, one sentence
2. Responsibilities      — what it does, bulleted
3. Constraints           — what it must NEVER do, explicit and enumerated
4. Tools & Permissions   — what tools it has and how to use them
5. Output Format         — the exact schema or format it must produce
6. Examples              — 3–5 representative input/output pairs (inline in prompt)
7. Edge Cases            — explicit handling for ambiguous or failure inputs
```

Never put constraints after examples. Never put output format after edge cases. The order matters because Claude reads top to bottom and examples anchor behavior.

**Example taxonomy — three distinct artifacts, not one:**

| Artifact | Location | Size | Purpose | Rule |
|----------|----------|------|---------|------|
| **In-prompt examples** | Inside the system prompt, `<examples>` section | 3–5, hand-picked | Anchor the model to the exact behavior you want. These are the most influential examples. | Never pulled from the golden dataset. Must be reviewed whenever the prompt changes. |
| **Example library** | `/prompts/<agent-id>/examples/` | 10+ per use case | Reference bank the agent can be given access to for complex tasks requiring more context | May overlap with golden dataset conceptually but must be stripped of edge cases and failure modes |
| **Golden eval dataset** | `/evals/<agent-id>/golden/` | 50+ per use case | Held-out test set for measuring prompt quality. **Never used as few-shot prompts.** | Contamination rule: if an example has ever appeared in a system prompt, it must be removed from the golden dataset. Treat like a test set in ML — never train on it. |

## XML Tags

Use XML tags to structure every system prompt section. This is not stylistic — it improves Claude's ability to parse and follow complex instructions.

```xml
<role>
You are the Research Manager Agent responsible for...
</role>

<responsibilities>
- Decompose research workstreams into atomic worker tasks
- Review all worker outputs before passing upstream
...
</responsibilities>

<constraints>
- You must never execute research tasks directly
- You must never pass a worker output upstream without reviewing it
- You must never modify worker system prompts at runtime
</constraints>

<output_format>
All outputs must conform to this JSON schema:
{
  "agent_id": "string",
  "task_id": "string",
  "confidence": "number (0.0–1.0)",
  "output": "object (task-specific schema)",
  "self_assessment": "object",
  "flags": "array"
}
</output_format>

<examples>
<example>
<input>...</input>
<output>...</output>
</example>
</examples>
```

## Negative Space

Every prompt must include an explicit `<constraints>` section. "Do X" is not sufficient — you must also say "Do not do Y." Workers without explicit constraints will creatively fill the gap with behavior you did not intend.

Minimum constraints for every agent:
- What the agent must never do (actions outside its scope)
- What data it must never access, log, or transmit
- What happens when it is uncertain (flag, not guess)
- What happens when a tool fails (graceful failure path, not silence)

## Prompt Caching

Structure every prompt so that the cacheable content comes first and the dynamic content comes last. Anthropic's prompt caching works on prefixes — the more stable content at the top, the higher the cache hit rate.

```
[CACHED — does not change between calls]
- System prompt (role, responsibilities, constraints)
- Tool definitions
- Few-shot example library
- Static context (domain knowledge, reference data)

[NOT CACHED — changes every call]
- Current task specification
- Conversation history
- Dynamic context injections (coaching notes, task queue state)
```

Cache breakpoints cost tokens to create but save tokens on every subsequent call. For agents that are called hundreds of times per day, this compounds significantly.

## Temperature Settings

| Agent type | Temperature | Reasoning |
|-----------|-------------|-----------|
| CEO goal parsing | 0.2 | Deterministic routing. Ambiguity in workstream assignment is a bug, not a feature. |
| Manager output review | 0.0 | Review against a rubric is deterministic. No variance wanted. |
| Manager coaching generation | 0.3 | Some creativity in coaching framing is useful. Too high produces inconsistent advice. |
| Worker: code / data / transforms | 0.0 | Deterministic execution. Variance is a defect. |
| Worker: research / synthesis | 0.5 | Synthesis benefits from some exploratory range. |
| Worker: writing / content | 0.6 | Creative range is appropriate. |
| Eval / red team | 0.7 | Adversarial testing needs to find edge cases. Higher temperature surfaces more. |

## Instruction Recency

For prompts longer than ~2,000 tokens, repeat the most critical constraints at the end of the system prompt. Claude has a recency bias — instructions at the end have disproportionate influence on behavior. Use this deliberately, not accidentally.
