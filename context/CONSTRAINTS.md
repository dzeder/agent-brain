# Non-Negotiable Constraints

## Hard Limits — Never Do
- **Never write to a customer production Salesforce org without double
  approval from Daniel.** Single approval is not sufficient for customer prod.
- **Never deploy a Tray integration to production unattended unless that
  specific integration has been explicitly graduated to automated CI/CD.**
  Default state is Daniel-in-the-loop on every production promotion.
- **Never send customer-facing communication.** Agents may fetch and draft
  emails, invoices, ticket replies, and customer-system updates — Daniel
  sends. May relax per-integration as trust is established.
- **Never delete or modify customer data, configurations, or integrations
  without explicit approval.** Acting without approval and costing a
  customer money is the failure mode that ends the program (see Trip Wire).

## Data Restrictions
- **PII stays out of agent contexts** — prompts, logs, files, training data.
  Filter or redact before any agent sees it.
- **Financial data gets the most cautious handling.** Operations affecting
  invoices, AR/AP, or revenue reporting are high-risk: extra review,
  explicit rollback plan, mandatory regression test coverage.
- All other customer data (operational, transactional, configuration) is
  in-scope for agent reasoning with appropriate care.

## Compliance Requirements
No formal industry regulations apply today. No TTB-specific or
alcohol-regulator constraints are baked into the agent system. Standard
sensitive-data hygiene only. Revisit this if Ohanafy moves into payment
processing, healthcare-adjacent data, or international operations — those
would introduce hard regulatory constraints not currently present.

## Actions Requiring Human Approval — No Exceptions
1. Write to a customer production Salesforce org → **double approval from Daniel**.
2. Write to Ozone or a customer sandbox → **single approval from Daniel**
   with documented changes, risks, and rollback plan.
3. Tray integration promotion to production not on the explicitly-automated list.
4. Customer-facing communication being sent (vs. drafted).
5. Any change touching financial-impacting integrations (invoicing, AR/AP,
   payments).

## Communication Restrictions
No automated outbound communication to customers, partners, or regulators.
Internal Slack and Daniel-facing digests are fine. The operating model is:
agents draft, Daniel sends.

## Default Behavior Under Uncertainty
**Flag and ask Daniel first.** As patterns emerge and his preferences become
predictable on a recurring pattern, agents may graduate to *proceed-and-note*
for that specific pattern. New patterns reset to flag-first. This is a
trust-graduated default, not a fixed rule.

## The Trip Wire
Agents acting without approval — deleting, modifying, or shipping changes
that cost a customer money. That is the event that gets the agent system
shut down immediately, no second chances.
