---
name: context-interview-product
description: >
  Run this skill when setting up a new product repo, or when a product's
  purpose, architecture, or constraints have changed significantly. Conducts
  a focused interview about the specific product and generates a CLAUDE.md
  for that product repo. Assumes the brain repo context files already exist
  (run context-interview-brain first). This skill produces product-scoped
  context only — things specific to this one product that would not belong
  in the brain repo's shared context files.
version: 1.0.0
outputs:
  - path: CLAUDE.md
compatible_agent_layers: [manager, worker]
tags: [onboarding, context, setup, product-repo]
---

# Skill: context-interview-product

## Purpose

Generate the `CLAUDE.md` for a specific product repo. This file is what Claude
Code reads before every task in that repo. It should be concise, architecture-focused,
and constraint-heavy — not a prose explanation of the product. Claude doesn't need
to understand the product deeply; it needs to know the rules for operating in the codebase.

## Prerequisite

The brain repo context files must exist before running this skill:
- `/context/[YOUR-NAME].md`
- `/context/[COMPANY].md`
- `/context/STACK.md`
- `/context/CONSTRAINTS.md`

If they don't exist, run `context-interview-brain` first.

## When to run

- Setting up a new product repo
- Major architectural change in an existing product
- New compliance requirements specific to this product
- The product's purpose or customer has shifted significantly

## What this does NOT generate

- The brain repo context files — those are handled by `context-interview-brain`
- Agent system prompts — those follow the hiring process in Phase 11
- Skill definitions — those follow Phase 12
- Anything that would be useful to 2+ products — that belongs in the brain repo

---

## The Interview

This is shorter than the brain repo interview — 10–15 minutes. The brain repo
context already covers the person, company, and general stack. This interview
focuses on what's specific to this product.

Ask conversationally. Follow up on anything vague.

---

### Section 1 — What is this product?

Cover these topics:

- Product name and one honest sentence: what it does, who uses it,
  what problem it solves. Not the pitch — the real answer.

- Who specifically uses this product? If it's internal, name the team.
  If it's customer-facing, describe the user more specifically than
  the brain repo's [COMPANY].md already does.

- What is this product's relationship to the other products in the portfolio?
  Does it depend on them? Do they depend on it?

- What is the most important thing working correctly in this product right now?
  What would break the business if it failed?

---

### Section 2 — The architecture of this product

Cover these topics:

- How is this product structured? Not every file — the key architectural
  decisions that shape how everything else is organized.

- What are the strict formatting rules for this codebase? Naming conventions,
  file structure, patterns that must be followed. Things an engineer
  violating them would get flagged in code review.

- What patterns must be avoided in this codebase? Either because they've
  caused problems or because the architecture doesn't support them.

- Are there any external APIs, data sources, or integrations specific to
  this product that aren't in the brain repo STACK.md?

- What does the test strategy look like for this product?

---

### Section 3 — Constraints specific to this product

Cover these topics:

- Are there any constraints specific to this product that aren't already
  in the brain repo CONSTRAINTS.md? Compliance, data handling,
  customer requirements.

- Are there any customers, partners, or integrations in this product where
  agents must be especially careful? Things specific to this product's
  user base.

- Is there anything in this product's codebase that agents must never
  modify without explicit human review — specific files, directories,
  or configuration?

- What are the failure modes specific to this product that would be most
  damaging? What should agents be most careful about here?

---

## Output Instructions

Generate a single `CLAUDE.md` file for the product repo root.

This file is read by Claude Code before every task. Optimize it for that use:
- Concise. Every line should earn its place. Under 200 lines.
- Architecture and constraints-heavy. Not prose narrative.
- Rules before explanations. Claude needs to know the constraints first.
- If it grows past 200 lines, split into `.claude/rules/*.md` with YAML
  frontmatter `globs` patterns so rules load only when relevant files are touched.

```markdown
# [Product Name] — Agent Context

## What This Product Is
[1–2 sentences. What it does, who uses it, what problem it solves.]

## Relationship to Other Products
[How this product relates to others in the portfolio. Dependencies, data flows,
shared infrastructure. If standalone, say so.]

## Architecture
[Key structural decisions. How the codebase is organized. Patterns agents must
follow. Patterns agents must avoid. Be specific enough that a violation would
be obvious.]

## Strict Formatting Rules
[Naming conventions, file structure, code organization standards that must
be followed in this repo. The things that get flagged in code review.]

## External Integrations Specific to This Product
[APIs, data sources, or services specific to this product not already covered
in the brain repo STACK.md. How agents should interact with each.]

## Test Strategy
[How tests are written, organized, and run in this product.]

## Constraints Specific to This Product
[Compliance, data handling, or customer requirements that apply only to this
product. What's not already in the brain repo CONSTRAINTS.md.]

## Files and Directories Requiring Human Review
[Specific files, directories, or configuration that agents must never modify
without explicit human sign-off. The codebase's protected zones.]

## What Would Break the Business
[The one or two things that, if they failed in this product, would cause
serious damage. What agents should treat with the most care.]

## Key References
- Operating standards: https://github.com/your-org/agent-brain/tree/main/standards
- Agent registry: /registry/agents.json
- Skill registry: /registry/skills.json
- MCP registry: /registry/mcp-servers.json
- Brain repo CLAUDE.md: [link]

## Overrides to Brain Repo Standards
[Explicit list of any brain repo standards this product overrides and why.
If there are none, write: "None. All brain repo standards apply as-is."]
```

---

## After generating the file

Tell the person:

1. **Commit this file to the product repo root.** Claude Code reads it
   automatically before every task.

2. **Review the "Overrides" section carefully.** Any override to the brain repo
   standards needs a strong reason. If there's no good reason, remove the override
   and follow the standard.

3. **Treat this file like a prompt.** Changes to CLAUDE.md go through the PR
   Anti-Drift gate. Version it. A change that alters how agents operate in this
   repo is a MINOR version bump. A clarification is a PATCH.

4. **If it grows past 200 lines,** split into `.claude/rules/*.md` files.
   Each rule file should have YAML frontmatter with a `globs` pattern so the
   rule only loads when agents are touching relevant files:

   ```yaml
   ---
   globs: ["src/api/**", "src/mcp/**"]
   ---
   # API and MCP Rules
   ...
   ```

5. **Re-run this skill** when the product's architecture changes significantly,
   when new compliance requirements apply, or when the product's purpose shifts.
   A stale CLAUDE.md is worse than no CLAUDE.md.
