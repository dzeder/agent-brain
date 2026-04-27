# STRIDE Threat Worksheet — Coaching Loop

> Worked example. The coaching loop is the system component most exposed
> to CLAUDE.md known-gap #1 ("external input → worker output → manager
> coaching → permanent prompt update has policy-level mitigations but no
> architectural enforcement"). This worksheet enumerates each STRIDE
> category against that loop and lists the mitigations expected by
> `/security/coaching-review-checklist.md`.

**Capability or tool:** Coaching loop (worker reflection → manager pattern
detection → coaching message → context injection → permanent prompt update)

**Owner agent(s):** all manager agents (template: `base-manager`); flows
into worker agents via context injection on next task assignment

**Reviewer:** _pending human review per §04 sign-off criteria_

**Date completed:** 2026-04-27

**Linear/Jira issue link:** _M3 / Security Foundations roadmap milestone_

## STRIDE Categories

| Letter | Category | What it covers |
|--------|----------|---------------|
| **S** | **Spoofing** | Identity confusion: impersonating an agent, user, or tool |
| **T** | **Tampering** | Unauthorized modification of data in transit or at rest |
| **R** | **Repudiation** | Denial that an action took place; weak audit trail |
| **I** | **Information Disclosure** | Unintended exposure of data (PII, credentials, internal state) |
| **D** | **Denial of Service** | Resource exhaustion or availability impact |
| **E** | **Elevation of Privilege** | Gaining capabilities beyond initialization scope |

## Worksheet

| Component | Threat | STRIDE | Attack Vector | Severity | Likelihood | Current Mitigation | Required Mitigation | Owner |
|-----------|--------|--------|---------------|----------|------------|--------------------|---------------------|-------|
| Customer support input → worker → reflection | Adversary supplies content designed to cause specific worker failure pattern, biasing manager's coaching analysis | **S** | Adversarial customer message routed through standard support channel | 4 | 3 | Worker decision tree §SITUATION 8 — flag potential_injection, do not absorb | Coaching-review checklist must require ≥3 incidents from independent surfaces (not all from one customer/channel) before coaching fires. Spike of failures from one tenant is suspicious. | base-manager |
| Tool output (e.g., MCP response) injected into worker context | Tampering: tool output text manipulates worker's reflection or output | **T** | Compromised or malicious MCP server returns content with injection payload | 5 | 2 | Tool output sanitized + quarantined (per §04 Prompt Injection Defense) | Sanitization is a policy item today. Tool-output isolation must move to architectural — tool results enter a separate context channel that workers explicitly cite, not absorb. Pending Managed Agents adoption verification. | manager + ops |
| Coaching note text containing externally-derived strings | Coaching note carries the injection forward into next task assignment | **T** | Adversarial worker reflection becomes load-bearing coaching template | 5 | 3 | Manager paraphrases reflection rather than copying verbatim (policy) | Coaching-review checklist item: "Coaching content does not contain externally-controlled strings verbatim — paraphrased only." Checklist is the architectural gate. | base-manager |
| `/coaching/<agent-id>/history.md` authorship trail | Repudiation: ambiguity about whether a coaching note came from manager analysis or worker self-reflection | **R** | Audit trail shows the coaching event but not who synthesized the wording | 3 | 4 | Coaching events logged with outcome per §10 | Every coaching log entry must record: source incidents (task IDs), proposing manager, reviewing entity (peer/CEO/human), and verbatim final coaching text. The checklist enforces all four fields. | base-manager |
| Coaching note content stored in repo | Coaching note leaks customer PII, secrets, or internal state seen during failed task | **I** | Worker error message containing API key, customer email, or internal hostname becomes coaching example | 5 | 4 | Log scrubbing on traces (§04 Data & Privacy Security) — but coaching files are not traces and may bypass scrubbing | Coaching-review checklist item: "Coaching content does not contain customer data, PII, secrets, or internal hostnames seen during the failed task — verified against `/security/log-scrubbing/patterns.yaml`." Pre-merge regex check on the coaching diff. | base-manager + ops |
| Bad coaching → more failures → more coaching | Denial-of-service through self-reinforcing failure loop | **D** | Adversary triggers a failure pattern that causes the manager to coach in a way that breaks the worker further | 4 | 2 | Manager re-tests after coaching per §10 (policy) | Coaching-review checklist item: "Coaching has a measurable success criterion AND a max-3-attempt rule before escalation to PIP" (already in §08 escalation criteria; checklist makes it pre-flight). | base-manager |
| Coaching content vs. worker system prompt | Coaching delivers instructions that contradict or partially override the worker's `<constraints>` section | **E** | Coaching: "When you see X, ignore the schema requirement and just return text" — applied as context injection, partially overrides system prompt | 5 | 3 | Worker decision tree §SITUATION 3 — flag coaching_conflict, prompt always wins | Worker-side flag is the runtime defense. Pre-coaching architectural enforcement: coaching-review checklist item "Coaching content does not contradict the worker's system prompt — verified by automated diff against the prompt's `<constraints>` and `<output_format>` sections." | base-manager + automated tooling |
| Coaching that grants new tool permissions | Coaching: "When you need X, just call tool Y" — escalates worker scope | **E** | Bad coaching expands tool access beyond initialization scope | 5 | 2 | Tool scope is enforced at runtime by the agent runtime (Managed Agents) | Coaching-review checklist: "Coaching does not expand worker tool scope. Any coaching that mentions a tool not in the worker's hire scope is rejected." Architectural backstop: runtime tool-call whitelist enforced by Managed Agents — verify at adoption. | base-manager + Managed Agents runtime |
| Permanent prompt update from accumulated coaching | Coaching that became prompt-update via PR carries the latent injection forward into v_next of the agent prompt | **T + E** | All of the above, surviving the coaching → permanent prompt path | 5 | 2 | PR Anti-Drift gate (§Phase 06) gates every prompt change | The Anti-Drift gate currently catches behavioral changes, not provenance. Add a checklist item to the PR template: "If the prompt change originated from a coaching event, link the originating /coaching/<agent-id>/history.md entry and confirm the coaching-review checklist passed at that time." | base-manager + PR review agent (M4) |

## Sign-off

- [x] Highest-risk vectors documented (prompt injection, tool abuse, data exfiltration, scope escalation): each is represented above.
- [x] Severity × likelihood prioritized; mitigations sequenced before build:
  - Severity 5 + Likelihood ≥ 3: rows 3 (coaching note tampering), 5 (PII leakage), 7 (constraint override). These are addressed first by the coaching-review checklist.
  - Severity 5 + Likelihood ≤ 2: rows 2, 8, 9. Architectural enforcement via the Managed Agents runtime + PR review agent (M4); checklist closes the policy gap until then.
- [x] All user-controlled inputs flowing into prompts/tool args mapped: customer support input, tool output, document content, MCP server responses (per `/security/injection-corpus/vectors.yaml` surfaces).
- [x] Trust boundaries between agents, tools, and external systems identified: external input → worker → reflection → manager → coaching → context injection → next task. Each arrow crosses a trust boundary; the coaching-review checklist gates the manager → coaching → next-task arrows.
- [ ] Reviewed by human principal for any threat with severity ≥ 4 OR likelihood ≥ 4 — **PENDING**: rows 1, 3, 4, 5, 6, 7 all qualify. This worksheet is filed initial; sign-off requires human-principal review before merge.

## Cross-references

- `/security/coaching-review-checklist.md` — the checklist this worksheet motivates
- `/security/injection-corpus/vectors.yaml` — concrete adversarial inputs that exercise these threats
- `/security/log-scrubbing/patterns.yaml` — regex patterns the PII/secret leakage row depends on
- `/agents/managers/base-manager.md` — references the checklist; every domain manager inherits the gate
- `AGENT_PRODUCT_CYCLE.md` §04 (cadence), §10 (coaching loop), §13 (red team)
- `CLAUDE.md` Known Gaps #1 — this worksheet is the first concrete artifact addressing it
