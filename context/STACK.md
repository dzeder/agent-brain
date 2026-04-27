# Technical Stack

## Core Platforms and Services
- **Tray.io** — current iPaaS. All integrations live here today. Strength:
  auth handled out of the box. Weakness: JSON schema authoring is
  friction-heavy for AI agents. Default platform for new integration work
  until the long-term platform decision is made.
- **Salesforce** — Ohanafy itself runs on Salesforce. Integration data
  terminates in Ohanafy/Salesforce objects.
- **Datadog** — Tray pushes all logs here. Primary surface for catching
  errors before customers see them and for spotting improvement signals.
- **GitHub** — source of truth for integration code. One repo today (a
  known mistake); future state is per-integration repos (quickbooks, xero,
  etc.) each with their own versioning, docs, config guides, and decision log.
- **AWS** — under evaluation, specifically for large-CSV and EDI workloads
  where Tray is awkward.

## Languages and Frameworks
JavaScript is the default — both inside Tray workflows today and likely for
any future n8n+AWS work. Generate JS unless the target system specifically
requires otherwise.

## Deployment Environment
Salesforce three-org model: **Ozone** (Ohanafy internal), **customer
sandboxes**, **customer production**. SF CLI is used heavily on Ozone and
sandboxes for speed; every change must come with a documented rollback plan.
Customer production goes through changesets today; Headless 360 may change
this in the future. Tray promotion is manual sandbox→prod today, with
GitHub-based CI/CD planned to graduate lower-risk integrations to automated
promotion as confidence grows.

## Data Layer
Bidirectional flow between customer systems and Ohanafy/Salesforce objects.
Financial data gets the most careful handling, but all data matters because
these are operational systems running customer businesses. PII stays out of
agent contexts (see CONSTRAINTS.md).

## Known Pain Points
- **Tray JSON schemas** are hard for AI agents to author cleanly. A
  schema-generation/validation skill is high-priority.
- **API vs UI divergence in Ohanafy.** API paths often don't replicate UI
  behavior (e.g., invoice auto-splitting). Agents must review the relevant
  Ohanafy product repo before generating integration code that hits Ohanafy.
- **Per-customer customizations.** Integration changes need regression test
  cases for every customer on that integration, every time.

## Off-Limits
Nothing flat-out forbidden. The constraint is process (approvals, rollback
plans, test coverage), not technology bans.

## Development Workflow
Sandbox-first. Customer production deploys = double approval + changeset
(see CONSTRAINTS.md). Tray promotion currently manual, automating gradually
per-integration as risk allows. All Tray logs flow to Datadog. Reviewing
the right Ohanafy product repo (~7 well-named repos) is mandatory before
building anything that writes to Ohanafy.

## Settled Decisions
- Three-org Salesforce model (Ozone / customer sandbox / customer prod).
- Datadog as integration log destination.
- JavaScript as the integration code default.
- Per-integration GitHub repos as the future structure (one repo per
  integration with its own versioning, docs, decision log).

## Open Decisions
- **Tray vs. n8n+AWS** as the long-term integration platform — decided by
  which platform the AI team can build in most efficiently. Until decided,
  Tray is the runtime; agents may target both where the cost is low.
- **AWS** specifically for large CSV and EDI workloads.
- **Headless 360**'s role in customer-production deploys.
