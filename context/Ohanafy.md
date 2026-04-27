# Ohanafy — Company Context

## What the Company Does
Salesforce-based ERP for the beverage supply chain. Both suppliers (Sierra
Nevada, BJ's Restaurant) and wholesalers/distributors (Molson Coors
wholesalers) run their operations on Ohanafy. The competitive moat is
integration capability — the main competitors VIP (1970s) and Encompass
(early 2000s) cannot integrate, so their customers manually duplicate data
entry between systems. Ohanafy's ability to integrate with the rest of the
customer's stack is the wedge.

## The Customer
Operations and IT leaders at beverage suppliers and wholesalers stuck on
legacy ERP doing manual data entry. They buy Ohanafy because it modernizes
their operations *and* connects to the other software they already run —
Cirrus tech, UKG, Samsara, Rehrig, QuickBooks, Xero, and others. Each
customer is currently bespoke as the product still searches for its
industry-specific shape.

## Stage and Priorities
Pre-Series-A. Founders describe the product as maturing; reality is that
every customer still gets a custom solution while product-market fit is being
refined. Stated philosophy is "ship now, perfect later" — but in practice,
"perfect later" rarely happens because new shiny work crowds it out. Agents
should bias toward closing hardening loops (tests, docs, error handling)
before taking on new work, even when not explicitly asked.

## What Matters Most Right Now
**Gulf Distributing.** First $1M+ contract, 4-month delivery window, multiple
integrations to ship: mostly CSV files plus Cirrus tech, UKG, Samsara, Rehrig,
and likely others. Must be perfect. This is the agent team's #1 priority
unless explicitly redirected.

## Key Relationships
Brain repo is private — customer names are not externally sensitive. But
customer-facing actions (emails, invoices, ticket replies) always go through
Daniel; agents draft, never send. The Salesforce CLI is the operational sharp
edge — high speed on Ozone and customer sandboxes, gated on customer
production (see CONSTRAINTS.md).

## What Success Looks Like
6 months out: AI-built integrations are real — agents create, enhance, and
support integrations end-to-end, with Daniel reviewing rather than building.
The Salesforce-native integration control plane is in flight (or shipped) so
customers and Daniel can monitor, fix errors, and run reports without leaving
the Ohanafy UI.

## What Has Failed
Two recurring patterns to design around:
1. **API-vs-UI behavioral divergence in Ohanafy.** Product engineering builds
   for the UI without making the API path consistent. Concrete example:
   invoices auto-split (beer / Red Bull / water) when created in the UI but
   not via the API. Agents must review the relevant Ohanafy product repo
   before generating integration code that hits Ohanafy — there are roughly
   seven main, clearly named product repos.
2. **Per-customer customizations create regression risk.** A change for
   customer A can quietly break customers B–F on the same integration. Test
   cases must grow every time an integration is enhanced or fixed.
