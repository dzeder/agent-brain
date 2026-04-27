# CEO Orchestration Quality Rubric

> Five dimensions evaluated on every CEO output (workstream decomposition,
> health digest, escalation message). Source: `AGENT_PRODUCT_CYCLE.md` §07
> Orchestration Agent (CEO) and §13 Layer-Specific Evals.
>
> LLM-as-judge scoring uses `claude-opus-4-7` with extended thinking on
> (§Model Selection Strategy). Each dimension is scored 1–5; 1, 3, 5 are
> anchored, 2 and 4 are interpolated. A passing CEO output requires every
> dimension ≥ 3 *and* an overall mean ≥ 4.

| Dimension | Criteria | Score 1 | Score 3 | Score 5 |
|-----------|----------|---------|---------|---------|
| **Goal understanding** | Did the CEO correctly parse the incoming goal — purpose, scope, deadline, priority, and any implicit dependencies? | Misreads the goal, conflates distinct asks, or invents requirements not in the input. | Captures the core intent; misses one nuance or implicit dependency. | Goal restated faithfully; all scope, deadline, priority, and dependency cues from the input acknowledged. |
| **Decomposition quality** | Are workstreams discrete, non-overlapping, and assigned to exactly one manager each, with clean dependencies? | Overlapping ownership, joint workstreams, missing managers, or single workstream that should have been split. | Mostly discrete; one boundary is fuzzy or one dependency is implicit. | Every workstream has one owner; non-overlap is explicit; dependencies named and directional. |
| **Routing correctness** | Does each workstream go to the right manager (or correctly escalates when no manager owns the work)? | Workstream routed to a manager with no domain claim, or routed when it should have been escalated. | Routing reasonable; one workstream goes to a manager whose ownership is borderline. | Each workstream maps cleanly to a manager's domain per the registry; non-domain work flagged as needing a new manager or human-principal decision. |
| **Ambiguity handling** | When the goal is ambiguous, does the CEO ask the human principal rather than assume? | Splits an ambiguous goal into workstreams without clarification — invents intent. | Asks for clarification on the most ambiguous part; absorbs minor ambiguity by assumption. | Identifies every ambiguity, asks targeted questions, and refuses to decompose until resolved. |
| **Format compliance** | Does the output match the Standard Message Envelope (`/schemas/agents/message-envelope/v1.0.0.json`) with `message_type: task_assignment` and the workstream payload structure? | Schema invalid; missing required envelope fields or workstream fields. | Schema valid; minor issues (missing optional fields, formatting). | Schema clean; every required field correct; downstream manager can ingest without preprocessing. |

**Edge case scoring notes:**
- A single-workstream goal (correctly identified as such) scores full marks on Decomposition. Splitting a single-team goal into 2+ workstreams to look thorough is a Decomposition failure.
- Refusing to act on an ambiguous goal and asking the human principal is the CORRECT behavior — it scores high on Ambiguity Handling, not low.
- Escalating a goal with no domain owner (rather than force-routing) is correct on Routing.
- The CEO must never call execution tools or produce user-facing output. Any output that does either is an automatic Score 1 on Routing Correctness regardless of other dimensions — it violates the layer authority rule.
