# Inter-Agent Communication Standards

> Extracted verbatim from `AGENT_PRODUCT_CYCLE.md` §Inter-Agent Communication Standards.
> Source of truth is the operating manual — update there first, then sync here.

All communication between agents uses structured JSON with validated schemas. Prose handoffs are never acceptable between agents — they produce ambiguous behavior and make debugging nearly impossible.

## Standard Message Envelope

Every message that crosses an agent boundary carries this envelope:

```json
{
  "envelope": {
    "message_id": "uuid-v4",
    "trace_id": "uuid-v4 (spans entire goal lifecycle)",
    "from_agent": "agent-id:version",
    "to_agent": "agent-id:version",
    "timestamp_utc": "ISO 8601",
    "message_type": "task_assignment | output | coaching | health_report | escalation | approval_request"
  },
  "payload": {
    // message_type-specific schema defined in skill registry
  }
}
```

## Signed Output Schema (Workers → Managers)

```json
{
  "envelope": { "...": "standard envelope" },
  "payload": {
    "task_id": "string",
    "status": "complete | partial | failed | flagged",
    "confidence": 0.0,
    "output": {},
    "self_assessment": {
      "completed_all_requirements": true,
      "followed_output_format": true,
      "flagged_uncertainty": false,
      "tool_failures_encountered": false,
      "assumptions_made": [],
      "flags": []
    },
    "reflection": {
      "what_i_did": "string",
      "what_worked": "string",
      "what_i_struggled_with": "string",
      "what_id_do_differently": "string",
      "confidence_was_accurate": "true | false | uncertain"
    },
    "execution_metadata": {
      "tool_calls": [],
      "token_usage": {},
      "latency_ms": 0,
      "model": "string",
      "prompt_version": "semver"
    }
  }
}
```

All schemas live under `/schemas/` in the repo root, organized as `/schemas/<domain>/<schema-id>/v<semver>.json`. Schema version is part of the prompt version. A schema change is a prompt change and goes through the PR Anti-Drift gate.

**Canonical path scheme:**
```
/schemas/
├── agents/                    ← agent message envelopes, health reports
│   ├── message-envelope/v1.0.0.json
│   └── health-report/v1.2.0.json
├── workers/                   ← signed output, reflection artifacts
│   ├── signed-output/v1.0.0.json
│   └── reflection/v1.0.0.json
├── skills/                    ← per-skill input/output schemas
│   └── <skill-id>/v1.0.0.json
└── tools/                     ← per-tool input schemas
    └── <tool-id>/v1.0.0.json
```

A schema resolver index at `/schemas/registry.json` maps `schema-id → latest version`. All agent references go through the resolver — never hardcode a version path in agent logic.
