# STRIDE Threat Worksheet — Template

> Copy this template for each agent capability and each tool. One row per
> threat. STRIDE is run per `AGENT_PRODUCT_CYCLE.md` §04 Security & Threat
> Modeling — the cadence is per-initiative, revisited on every PR that
> changes agent capabilities.

**Capability or tool:** _<name>_
**Owner agent(s):** _<agent-id list>_
**Reviewer:** _<name>_
**Date completed:**
**Linear/Jira issue link:**

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

| Component | Threat | STRIDE Category | Attack Vector | Severity (1–5) | Likelihood (1–5) | Current Mitigation | Required Mitigation | Owner |
|-----------|--------|-----------------|---------------|----------------|------------------|--------------------|---------------------|-------|
|           |        |                 |               |                |                  |                    |                     |       |
|           |        |                 |               |                |                  |                    |                     |       |
|           |        |                 |               |                |                  |                    |                     |       |

## Sign-off

- [ ] Highest-risk vectors documented (prompt injection, tool abuse, data exfiltration, scope escalation)
- [ ] Severity × likelihood prioritized; mitigations sequenced before build
- [ ] All user-controlled inputs flowing into prompts/tool args mapped
- [ ] Trust boundaries between agents, tools, and external systems identified
- [ ] Reviewed by human principal for any threat with severity ≥ 4 OR likelihood ≥ 4
