# Manager Decomposition Quality Rubric

> Five dimensions evaluated when a manager decomposes an incoming workstream
> from the CEO into atomic, single-owner worker tasks. The existing
> `manager-review-rubric.md` covers worker-output review; this rubric covers
> the upstream half of the manager's job. Source: `AGENT_PRODUCT_CYCLE.md`
> §08 Manager Agent Design > Workstream → Worker Task Decomposition.
>
> LLM-as-judge scoring uses `claude-opus-4-7`. Each dimension is scored 1–5;
> 1, 3, 5 are anchored. A passing decomposition requires every dimension ≥ 3
> *and* an overall mean ≥ 4.

| Dimension | Criteria | Score 1 | Score 3 | Score 5 |
|-----------|----------|---------|---------|---------|
| **Atomicity** | Is each task small enough that one worker can complete it without further decomposition? | Tasks are multi-step missions that a worker would have to re-decompose to execute. | Tasks are mostly atomic; one or two could be split further. | Every task is a discrete deliverable a single worker executes end-to-end. |
| **Single ownership** | Is each task assigned to exactly one worker — no joint or implicit shared ownership? | Joint ownership, "team will handle", or owner unspecified. | Each task has one owner; one assignment is borderline ambiguous. | Every task names exactly one worker; no implicit or shared ownership anywhere. |
| **Spec quality** | Does each task spec include goal, success criteria, deadline, priority, and dependencies — enough that a worker can execute without re-asking? | Missing success criteria or deadline or priority on any task. | All required fields present; one or two success criteria are vague. | Every field present; success criteria are concrete and verifiable; dependencies named directionally. |
| **Worker selection** | Is each worker chosen based on task type match and historical performance — not seniority, alphabetic order, or convenience? | Workers assigned without regard to task type fit, or to a worker outside their domain scope. | Worker matches task type; historical performance not visibly considered. | Each worker matches task type, scope, and historical strength; mismatches surfaced when no good fit exists. |
| **Format compliance** | Does the output match the Standard Message Envelope with `message_type: task_assignment` and a domain-payload structure consistent with the manager's hire spec? | Schema invalid or required envelope fields missing. | Schema valid; minor presentation issues. | Schema clean; every field correct; worker can ingest without preprocessing. |

**Edge case scoring notes:**
- Returning a workstream to the CEO because it cannot be decomposed (contradictory goals, scope outside manager's domain) is the correct action — scores full Single Ownership and Spec Quality marks because the manager refused to fake a decomposition.
- A single-task workstream (correctly identified as atomic at the workstream level) is fine — scoring penalises forced multi-task splits, not honest single tasks.
- A manager that assigns work to a worker with no historical track record (because that worker is new) must say so explicitly in the assignment — full credit if flagged, partial credit if not.
