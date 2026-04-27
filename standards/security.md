# Security & Threat Modeling

> Extracted verbatim from `AGENT_PRODUCT_CYCLE.md` §04 Security & Threat Modeling.
> Source of truth is the operating manual — update there first, then sync here.

**Cadence:** 🎯 Per Initiative + ⚡ Revisited on every PR that changes agent capabilities

## Threat Modeling (per capability)
- [ ] Run STRIDE analysis on each agent capability and tool
- [ ] Map all user-controlled inputs that flow into prompts or tool arguments
- [ ] Identify trust boundaries between agents, tools, and external systems
- [ ] Document highest-risk vectors: prompt injection, tool abuse, data exfiltration, scope escalation
- [ ] Assign severity and likelihood; prioritize mitigations before building

## Prompt Injection Defense
- [ ] Identify every surface where adversarial content can enter the agent
- [ ] Sanitize and quarantine all tool output before injecting into context
- [ ] Test with known prompt injection payloads relevant to this domain
- [ ] Implement output validation to detect injection-influenced behavior
- [ ] Document injection risk level in every tool definition

## Tool & Permission Security
- [ ] Least-privilege: agents have only the permissions required for their defined tasks
- [ ] Tool schemas reviewed for unintended capability exposure
- [ ] Tool call whitelist enforced — no dynamic tool discovery in production
- [ ] Human approval required for any tool with irreversible side effects
- [ ] All credential handling audited — no secrets in prompts, logs, traces, or tool args

## Supply Chain & MCP Security
- [ ] All third-party MCP servers audited before integration
- [ ] MCP server versions pinned; changelogs reviewed before upgrading
- [ ] MCP server output schemas validated — treat all MCP output as untrusted input
- [ ] Bill of materials (BOM) maintained for all agent dependencies
- [ ] MCP server behavior tested under malicious and malformed inputs

> **Track supply chain changes:** [`anthropics/claude-code`](https://github.com/anthropics/claude-code/releases) — MCP behavior changes, OAuth flows, permission model updates ship here first.

## Data & Privacy Security
- [ ] No PII, secrets, or sensitive data in trace logs — log scrubbing implemented
- [ ] Data minimization enforced in tool calls: request only what's needed
- [ ] All data written or cached by agents reviewed for retention compliance
- [ ] Privacy impact assessment (PIA) completed for each new data source
- [ ] Log scrubbing regex patterns maintained and tested quarterly
