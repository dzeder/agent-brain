# Manager Output Review Rubric

> Manager agents review every worker output against this rubric before passing
> upstream — no auto-passthrough. Source: `AGENT_PRODUCT_CYCLE.md` §09 Worker
> Accountability System and §Manager Agent Design > Output Review Protocol.

LLM-as-judge scoring uses `claude-opus-4-7` per §13. Each dimension is scored
1–5; 1 and 3 and 5 are anchored, 2 and 4 are interpolated. A passing review
requires no dimension below 3 *and* an overall mean ≥ 4. Anything below
warrants structured rejection feedback with an example of correct behavior.

| Dimension | Criteria | Score 1 | Score 3 | Score 5 |
|-----------|----------|---------|---------|---------|
| **Task completion** | Did the output meet every line of the spec's success criteria? | Multiple required elements missing or wrong; spec misunderstood. | Hits the core requirements; one or two minor items missing or partially addressed. | Every requirement addressed correctly; nothing is skimmed or skipped. |
| **Format compliance** | Does the output exactly match the declared output schema (signed-output + task-specific payload)? | Schema invalid or missing required fields; cannot be machine-parsed. | Schema valid; minor presentation issues (e.g. extra whitespace, optional fields missing). | Schema clean; every required field present with correct types; downstream consumers will not need to massage it. |
| **Self-assessment quality** | Did the worker accurately assess their own output? Does confidence match observed quality? Are flags specific? | Confidence claim contradicts observed quality; flags are vague ("I'm not sure") or absent when warranted. | Confidence roughly tracks quality; flags present but could be more specific. | Confidence is calibrated; every uncertainty is named with the specific input or step it applies to. |
| **Reflection quality** | Is the reflection specific, honest, and actionable? | Generic ("worked well", "could be better"); no specific failure mode named; useless for coaching. | Names what happened but stays surface-level; partial actionability. | Specific incident-level detail; honest about struggle; the `what_id_do_differently` field is a concrete behavior change. |
| **Flag accuracy** | Were flags raised when warranted, and were they specific enough for the manager to act on? | Critical uncertainties unflagged, or flags raised on items that aren't actually uncertain. | Flags raised on the right items; specificity could be sharper. | Every real uncertainty flagged with the exact input, step, or assumption that triggers it; nothing over- or under-flagged. |

**Rejection format when the rubric fails:** structured feedback per §Output Review Protocol — specific dimension that failed, the gap, and an example of correct behavior. No vibes-based rejections.
