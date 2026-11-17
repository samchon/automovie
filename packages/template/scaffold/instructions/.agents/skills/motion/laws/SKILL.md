---
name: motion-laws
description: Extends the motion vocabulary with a registered row or law.
---

# Motion laws

A law is the code that plans an action: given a body and its inputs, it produces the same motion every time. Start from [vocabulary extension](extension.md), which decides whether a beat needs a law at all and states what an extension owes. Every law then follows [effector goals](authoring.md), and the other pages where it needs them.

| Read | To |
| --- | --- |
| [Vocabulary extension](extension.md) | Find the cheapest route for an action or body the vocabulary lacks |
| [Effector goals](authoring.md) | State movement as goals on targets, never as tuned joint angles |
| [Law design](declaration.md) | Design a law's plan, entry state, events, outcome and time scale |
| [Variation](variation.md) | Vary a law by parameters, skill or seed |
| [Transitions and layers](transitions.md) | Cut a law, change its target mid-motion, or write or run a layer over it |
| [Contacts](contacts.md) | Plant, grip, carry or touch |
| [Verification](verification.md) | Write a law's bounded checks and review its frames |
| [Method references](method-references.md) | Choose a law's algorithm from primary sources |
