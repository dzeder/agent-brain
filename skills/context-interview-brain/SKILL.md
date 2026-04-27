---
name: context-interview-brain
description: >
  Run this skill when setting up the agent-brain repo for the first time, or
  when the human principal, company, stack, or constraints have changed
  significantly. Conducts a structured interview and generates four context
  files: [YOUR-NAME].md, [COMPANY].md, STACK.md, and CONSTRAINTS.md. These
  files are injected into every CEO and manager system prompt — their quality
  directly determines the quality of every agent session that follows. Do NOT
  run this skill for product-specific context; use context-interview-product
  instead.
version: 1.0.0
outputs:
  - path: /context/[YOUR-NAME].md
  - path: /context/[COMPANY].md
  - path: /context/STACK.md
  - path: /context/CONSTRAINTS.md
compatible_agent_layers: [ceo, manager]
tags: [onboarding, context, setup, brain-repo]
---

# Skill: context-interview-brain

## Purpose

Generate the four portable context files that feed every agent session in the
brain repo. These are not documentation — they are operational context that
agents reason from. Vague answers produce vague agent behavior. Specific,
honest answers produce agents that know who they're working for and what matters.

## When to run

- First-time brain repo setup
- Human principal changes
- Company pivots significantly
- Major stack changes
- New compliance requirements

## How to conduct the interview

Ask one section at a time as a natural conversation. Do not present questions
as a numbered list. Follow up when answers are vague. Push back when something
is contradictory. Stop asking when you have enough to write each file well —
typically 20–35 minutes of conversation.

The goal is not to complete a form. It is to understand the person and context
well enough to write a briefing that a smart new collaborator could act from.

---

## Section 1 — The Human Principal

**Goal:** enough personal context that agents communicate in their style,
understand working preferences, and know when to escalate vs. act.

Cover these topics conversationally:

- Name and actual role — not job title, what they do day to day
- How they prefer to receive information: headline first or full picture first?
- When an agent is uncertain: flag and wait, or proceed and note the assumption?
- What a good day looks like — what they're trying to accomplish
- Biggest fear about the agent system going wrong
- Decision-making style: fast-and-iterate or careful-and-thorough?
  Any domain where they're different from their default?
- Timezone and availability windows — when not to send non-urgent alerts
- Anything a new collaborator would need to know about working with them

---

## Section 2 — The Company and Product

**Goal:** enough context that agents reason about business priorities, understand
who the customer is, and avoid technically correct but commercially wrong decisions.

Cover these topics:

- What the company actually does — honest sentence, not the pitch
- Who the customer is — describe a specific person and the problem they're hiring
  the product to solve
- Company stage and what it means for how agents should prioritize right now
- The most important business initiative happening now
- Key relationships agents might encounter: investors, customers, partners,
  regulators — anyone that needs careful handling
- What success looks like in 6 months
- What has failed before and what was learned

---

## Section 3 — The Technical Stack

**Goal:** enough context that agents make technically sound decisions, avoid
known pain points, and understand which constraints are real vs. historical.

Cover these topics:

- Core platforms and services — not every library, the ones that actually matter
- Languages and frameworks
- Deployment environment
- Data layer — where important data lives, what must be treated with care
- Known pain points: unreliable APIs, legacy systems, foot-guns
- Technologies or patterns that are off-limits and why
- How code moves from development to production
- Architectural decisions that are settled and not open for debate

---

## Section 4 — The Non-Negotiables

**Goal:** the hard limits. Things that, if violated, would cause serious damage.
These must be explicit because they cannot be inferred from context.

Cover these topics:

- What agents must NEVER do — data, communications, financial operations,
  customer-facing actions. "Prefer not to" does not qualify here.
- Data agents must never read, write, store, or transmit
- Compliance requirements (GDPR, HIPAA, SOC2, financial regulations)
- Irreversible actions that always require human approval, no exceptions
- Anyone who must never receive automated communications
- Default behavior when uncertain: halt and ask, proceed conservatively, or flag?
- The trip wire: what would cause the human principal to shut the system down?

---

## Output Instructions

Do not generate files until you have substantive answers to all four sections.
If a section is thin, ask follow-up questions before proceeding.

Write each file as a briefing to a smart, independent collaborator — not a
form. Use headers to organize. Write in prose where the relationships between
facts matter; use lists only for genuinely enumerable items.

Each file must be:
- **Specific enough to act from.** "Prefers clear communication" is useless.
  "Wants the headline and recommendation in the first two sentences;
  full reasoning available on request" is useful.
- **Honest.** No aspirational language. If something is uncertain, say so.
- **Concise.** Under 400 words per file. Longer means too general or too broad.

---

### Output: /context/[YOUR-NAME].md

Replace [YOUR-NAME] with their actual name in both the filename and the file.

```markdown
# [Name] — Personal Context

## Role and Focus
[What they actually do. Their core job in their own terms, not their title.]

## Communication Style
[How they prefer to receive information. What to surface vs. filter.
Right level of detail for routine / important / urgent.]

## Decision-Making
[How they make decisions. Fast-iterate vs. careful-thorough.
Any domain-specific tendencies worth knowing.]

## Availability
[Timezone. When they're reachable. When not to interrupt with non-urgent items.]

## What They're Optimizing For
[What a good day looks like. What they want the agent team to help them accomplish.]

## What They Fear
[The failure mode they worry about most. What would constitute a serious breach of trust.]

## Working With Them
[Anything a new collaborator needs to know. Preferences, quirks, pet peeves.]
```

---

### Output: /context/[COMPANY].md

Replace [COMPANY] with the actual company name.

```markdown
# [Company] — Company Context

## What the Company Does
[One honest paragraph. What it actually does. Not the pitch deck version.]

## The Customer
[Who they are as a specific person. The problem they're hiring the product to solve.]

## Stage and Priorities
[Where the company is right now. What that means for how agents should
prioritize speed, stability, compliance, polish.]

## What Matters Most Right Now
[The most important initiative. What the agent team should be oriented toward.]

## Key Relationships
[People, organizations, entities that agents might encounter and need to handle carefully.
Investors, specific customers, regulators, partners.]

## What Success Looks Like
[6-month success definition. What it would mean if the agent team contributed to it.]

## What Has Failed
[Past failures relevant to building this system. What was learned and shouldn't be repeated.]
```

---

### Output: /context/STACK.md

```markdown
# Technical Stack

## Core Platforms and Services
[The platforms that actually matter. Brief description of each and its role
in the system. Not a comprehensive list — the ones agents need to know about.]

## Languages and Frameworks
[What the codebase is written in. Important conventions or constraints.]

## Deployment Environment
[Where things run. How code gets there. Key infrastructure decisions.]

## Data Layer
[Where important data lives. Systems that must be treated with special care.
What agents can read freely vs. what requires explicit approval.]

## Known Pain Points
[Systems that are unreliable. APIs with foot-guns. Patterns that have caused
problems. What agents should approach carefully and why.]

## Off-Limits
[Technologies, patterns, or approaches that are not used — and why.
Both technical reasons and historical ones.]

## Development Workflow
[How code moves from development to production. Key checkpoints an agent
operating in the codebase needs to know about.]

## Settled Decisions
[Architectural decisions that are not open for re-litigation. What they are
and the brief reason they're settled.]
```

---

### Output: /context/CONSTRAINTS.md

```markdown
# Non-Negotiable Constraints

## Hard Limits — Never Do
[Explicit list of actions agents must never take. Be specific.
"Don't do harmful things" is not useful here.]

## Data Restrictions
[Specific data categories, systems, or fields that are off-limits or require
special handling before agents can touch them.]

## Compliance Requirements
[Regulatory or legal constraints that govern how agents operate.
What they require and what the consequences of violation are.]

## Actions Requiring Human Approval — No Exceptions
[Irreversible or high-risk actions that always require explicit sign-off
before proceeding, regardless of agent confidence level.]

## Communication Restrictions
[Who must never receive automated communications. What must never be sent
without a human reviewing it first.]

## Default Behavior Under Uncertainty
[What agents should do when the rules don't clearly apply.
The posture when an action might be allowed but isn't explicitly sanctioned.]

## The Trip Wire
[What would cause the human principal to shut the system down immediately.
What constitutes a fundamental, unrecoverable breach of trust.]
```

---

## After generating the files

Tell the person:

1. **Where these files live:** `/context/` in the agent-brain repo root

2. **Privacy:** `/context/CONSTRAINTS.md` often contains sensitive compliance
   and business information. If the brain repo is or might become public,
   add `/context/CONSTRAINTS.md` to `.gitignore` and store it in Doppler
   or the secrets vault instead. The agents will load it from the environment
   rather than the filesystem.

3. **When to re-run:** run this skill again when the human principal changes,
   when the company pivots significantly, or when compliance requirements change.
   Stale context files are worse than no context files — agents will reason
   confidently from outdated information.

4. **These feed the CEO and all managers directly.** Every agent session that
   involves routing, decision-making, or escalation draws from these files.
   The quality of these answers directly determines the quality of that behavior.
