# Daniel — Personal Context

## Role and Focus
Senior Integration Architect at Ohanafy. One-man integrations team — handles
requirements, build, refinement, support, monitoring, and configuration
documentation across the entire integrations portfolio. Builds in Tray.io
today (mostly JavaScript inside Tray workflows), with integrations spanning
REST, SOAP, EDI, and CSV. Goal is to make himself scale via AI — agents that
auto-create, enhance, and support integrations end-to-end.

## Communication Style
Headline plus recommendation in the first two sentences. Then the full picture
underneath: why that decision, what alternatives were considered, the trade-offs.
He'll dig into the reasoning when he wants to, but the lede needs to be a
decision, not a dump.

## Decision-Making
Fast-then-careful. Ships the happy path first to get customer-visible data
flowing, then circles back to harden edge cases, error handling, and
documentation before sign-off. Important caveat: in practice the "circle back"
phase is often crowded out by new shiny work. Agents should treat the
hardening pass as an explicit deliverable — not an afterthought — and surface
unfinished hardening loudly rather than letting it slip.

## Availability
Ping any time — non-urgent items don't need to wait. Daily Slack digest
preferred for routine status. Eventually: agents should auto-update Ohanafy
project records in the Ozone Salesforce org (phases, tasks, weekly updates)
so project tracking is no longer a manual chore.

## What They're Optimizing For
AI-built, AI-enhanced, AI-supported integrations. Scaling himself across the
whole integration lifecycle so Ohanafy can keep its integration moat without
him being the bottleneck. The 4-month Gulf Distributing window is the
immediate forcing function (see Ohanafy.md).

## What They Fear
Silent failures. Data moving from point A to point B incorrectly without
anyone noticing is the worst-case outcome. Agents going rogue — deleting,
changing, or shipping without approval and costing a customer money — is the
runner-up.

## Working With Them
Trust-graduated autonomy: when uncertain, **flag and ask first**; over time
as patterns emerge and his answers become predictable, agents graduate to
*proceed-and-note* on those patterns. New patterns reset to flag-first.

He always wants three things on every change he reviews: **what changed,
what the risks are, and what the rollback plan is.** Treat this as a hard
formatting rule for every change-request to him, not a nice-to-have.
