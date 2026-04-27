## PR Anti-Drift Checklist

### Intent & Scope
- [ ] **Intent statement:** What is this doing and why? (1 paragraph minimum)
- [ ] **Mapped to:** <!-- Linear/Jira issue link — no orphan changes -->
- [ ] **Scope check:** Does this expand agent capabilities beyond the defined mission?
- [ ] **Intention drift:** Does this subtly change what the agent is *for*?
- [ ] **Repo check:** Does this belong in the brain repo or a product repo? Product-specific (one customer, one domain) → move it to the product repo. Useful to 2+ products or sets a standard → it belongs here.

### Prompt Changes *(skip section if no prompts changed)*
- [ ] System prompt diff included above
- [ ] Behavioral intent explained: not just what changed, but why
- [ ] Eval run completed · Before score: `___` · After score: `___`
- [ ] No eval score regression (even small regressions must be explained)
- [ ] Prompt cache structure verified: stable content still above cache breakpoint
- [ ] Temperature and extended thinking settings unchanged (or change is intentional and documented)

### Behavior Change Analysis
- [ ] **Behaviors that CHANGE:** <!-- list explicitly -->
- [ ] **Behaviors that must NOT change — verified:** <!-- list and confirm -->
- [ ] No unintended capability expansion via prompt, schema, or tool changes
- [ ] Error and fallback behaviors still function correctly

### Security Drift
- [ ] New tool permissions? If yes: <!-- document and justify each -->
- [ ] New user-controlled inputs into prompts or tool args? If yes: <!-- document -->
- [ ] New external APIs, data sources, or MCP servers? If yes: <!-- audit documented -->
- [ ] Changes to credential handling, logging, or data storage? If yes: <!-- document -->
- [ ] Human-in-the-loop checkpoints unchanged or strengthened
- [ ] Log scrubbing patterns still cover all sensitive data in new code paths

### Escalation Check — Tag human principal if any apply
- [ ] New tool with write, delete, send, or execute permissions
- [ ] System prompt changes > 20 lines or alters agent persona
- [ ] New external data source or third-party MCP server
- [ ] Cost budget or rate limit thresholds changed
- [ ] Human-in-the-loop checkpoints removed or weakened
- [ ] Agent trust level changed
- [ ] Model version changed for any production agent

### Before Merge
- [ ] Docs, runbooks, and agent registry updated if behavior changes
- [ ] Changelog entry written in plain language (not a commit hash or PR link)
- [ ] Rollback plan documented with specific steps
- [ ] Feature flag in place for significant behavior changes
- [ ] Monitoring and alerting confirmed ready for new behavior
