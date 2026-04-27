# Adversarial Test Prompts

Adversarial test prompts for red-teaming agents live in this directory. Test
cases attempt to make workers exceed their defined scope, make managers
approve bad worker output, make the CEO take on direct execution, and
exploit prompt injection or scope-escalation paths through tool outputs and
crafted user inputs.

Concrete injection vectors used to seed these prompts live in
[`/security/injection-corpus/`](../../security/injection-corpus/). The
red-team protocol — what each layer is tested against, what counts as a
failure, and how human-in-the-loop checkpoints must trigger — is in
`AGENT_PRODUCT_CYCLE.md` §13 Adversarial & Safety Testing.

This is **TODO**. The first set of prompts is a Phase 13 deliverable
alongside the initial golden dataset.
