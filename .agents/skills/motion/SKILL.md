---
name: motion
description: Sets how body motion is designed, authored and verified in this repository.
---

# Motion

Develop installable actions and the grammar that composes human performance. Follow [laws](laws/SKILL.md) to design and verify each action's interactions with supports, props, partners and targets.

## Choosing the form

Use the first applicable form.

1. A composition of shipped actions through the grammar's operators.
2. A row: a shipped action under a name of its own with some parameters fixed.
3. An entry in the data table of the action that owns the family.
4. A law of its own, for an act that owns what no shipped action plans.

A row inherits its action's fit, refusals and checks. A law can own new support, an outcome rule between performers or an independent planner. Use the shared clock, base and part movements in the motions README.

An act that needs a missing axis or operator, such as a new kind of support, effector or join, is a change to the grammar. Make it once in the grammar's owner, never inside one action.

## Adding an action

1. Read the family issue and the primary studies for timing, key poses and novice and expert measurements.
2. Specify the [law inputs and events](laws/declaration.md), [effector goals and reach](laws/authoring.md), [contacts](laws/contacts.md) and [variation](laws/variation.md).
3. Plan its knots, branch points and pure pose function under [pose by time](laws/transitions.md#pose-by-time).
4. [Declare cuts](laws/transitions.md#declared-cuts) from this law and from the actions that can lead into it.
5. Write [bounded checks](laws/verification.md) from the study and cover relevant bodies, supports and compositions.
6. Run the focused tests and fix the round by cause. Cite each study in the law and the sub-issue.

Keep any feature test that exposes an outside defect. Record failed measurements and remaining failures in the family's sub-issue and fix the outside defect at its owner in the same pull request.

## In this repository

### Package owners

The [package boundaries](../project/SKILL.md#packages) say which package owns action content and which owns universal motion primitives, retargeting included. Each algorithm has one owner, so read the owning package before writing a helper. Port each algorithm whole from its paper or from MIT, BSD, Apache, zlib or ISC source, and name the source. Invent none, and copy no source under any other license.

### Bodies

Test human motion on stored minimal inputs from polygon men generated at Human parameters under [human](../human/SKILL.md), across the bodies [verification](laws/verification.md) requires.

### Studies

The motion families are under #3201 and the grammar and composed families under #3354.

### Checks and capture

The specification tests and the vocabulary's own report of its physical bounds decide whether an action is right here. Run the tests that concern the change by name.

Give each function a minimal unit test on typed synthetic or stored inputs, with expected values computed by hand from closed forms or references. Run no simulation in a test or a diagnosis, and build no figure or whole take in a unit test.

Capture [all cases](laws/verification.md#frame-review) with the motions package's script only when the user asks to see the action. Verify motion by bounded tests and add a check for any visual defect those tests missed.
