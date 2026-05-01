# Trust Levels

Source: `AGENT_PRODUCT_CYCLE.md` §11 Trust Levels & Promotion (lines 1775–1780) and §16 Trust Level Governance (lines 2116–2123). This file restates the manual as a queryable table — the manual remains authoritative for ties.

## Levels

| Level | Oversight cadence | Promotion criteria (all must hold) |
|---|---|---|
| **Supervised** *(initial)* | Human principal reviews **20% random sample of outputs weekly**. | n/a — every new agent starts here. |
| **Semi-autonomous** | Human principal reviews **weekly digest of activity** (not individual outputs). | (a) ≥30 calendar days OR ≥100 production tasks, whichever is later<br>(b) rolling 7-day eval score ≥ 0.85<br>(c) no open PIPs<br>(d) no PIP closed in the last 14 days<br>(e) human-principal explicit sign-off |
| **Autonomous** | **Alert-only** oversight. | All semi-autonomous criteria sustained for **≥60 additional days**, plus a security audit of the agent's tool permission scope and coaching history, plus human-principal explicit sign-off. |

## Governance rules

1. **Sign-off is non-delegable.** Every trust-level change requires human-principal explicit sign-off (manual line 2121). Backup principal counts only when the primary is unreachable per the human-principal-role policy.
2. **Decision-registry write is mandatory.** Every trust-level change writes a record to the Notion decision registry with `decision_type: "trust"`, including rationale and the specific evidence (eval scores, task counts, PIP history) at time of change. Schema: `/schemas/registry/decision/v1.0.0.json`.
3. **Registry record persists the metrics.** The trust-level entry in `/registry/agents.json` carries the date, approver, and the specific metrics at time of promotion (manual line 1779) — not just the level itself.
4. **Demotion is symmetric.** Quarterly review evaluates every agent's trust level; demotion follows the same sign-off and decision-record rules as promotion. Sustained drop below the promotion threshold is the trigger.
5. **Quarterly review is platform-wide.** All trust-level assignments across the full agent roster are reviewed (manual line 1956). The review runs in the quarterly audit window and lands as `/audits/YYYY-Qn/trust-level-review.md` per manual line 2394.

## Anti-patterns

- **Conditional promotion** ("promote when current PIP closes") — not allowed. The 14-day clean window after a closed PIP is hard-coded in the criteria.
- **Promotion based on streak alone** — eval score must be the rolling 7-day measure, not cherry-picked windows.
- **Silent demotion** — demotions also write a decision record. There is no "quiet" trust adjustment.
- **Aggregate trust on templates** — `base-manager` and `base-worker` are templates, not hireable agents (registry status `TEMPLATE`). Trust levels apply only to extensions in product repos that hold status `ACTIVE` or `TRIAL`.

## Cross-references

- Hiring checklist: `AGENT_PRODUCT_CYCLE.md` §11 Agent Hiring & Onboarding
- Decision-record schema: `/schemas/registry/decision/v1.0.0.json` (mirror of manual lines 2000–2024)
- Override & kill-switch (separate authority, governed alongside trust changes): manual lines 2125–2131
- Quarterly audit cadence: manual §Doc Maintenance lines 2388–2399
