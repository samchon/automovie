---
name: motion
description: Sets how body motion is designed, authored and verified in this repository.
---

# Motion

Develop installable actions and the grammar that composes them. Verify each action across supported bodies, partners and compositions. A production registers its own action only for a gap.

Composition must support every kind of human motion.

Plan interactions with the floor, props, partners and targets. Follow [laws](laws/SKILL.md) to design and verify actions.

## Choosing the form

Use the first applicable form:

1. A composition of shipped actions through the grammar's operators.
2. A row: a shipped action under a name of its own with some parameters fixed.
3. An entry in the data table of the action that owns the family.
4. A law of its own, for an act that owns what no shipped action plans.

A row inherits its action's fit, refusals and checks. Use a law for new support, a new outcome rule between performers or an independent planner. Build it with the shared clock, base and part movements. See the motions README.

An act that needs a missing axis or operator, such as a new kind of support, effector or join, is a change to the grammar. Make it once in the grammar's owner, never inside one action.

## Adding an action

### 1. Source reading

Read the action's primary studies for key poses, phase timing and novice and expert measurements.

### 2. Law surface

Declare parameters, targets, events, decisive instant and outcomes under [law design](laws/declaration.md). Specify the [out-of-reach rule](laws/authoring.md#out-of-reach).

### 3. Goal plan

Write the plan as [effector goals](laws/authoring.md) with their [contact windows](laws/contacts.md). The plan starts from the entry state and takes every quantity that varies from [skill and seed](laws/variation.md).

### 4. Declared cuts

Declare the action's [cuts](laws/transitions.md#declared-cuts) in both directions: the actions this one may be cut into, and this action as a target among the cuts of the actions that lead into it.

### 5. Test specification

Specify the action in tests with bounded checks under [verification](laws/verification.md). A test states what a person does with a number from the study, never what the code returned.

Cover variations, bodies and supports with a compact case set and assertions across related runs.

### 6. Test run and fixes

Run the tests and fix the round's findings by cause, as the repository's AGENTS.md requires.

Keep a specification exposing an outside defect in feature tests. Record the failed measurements in its document and issue. Have the owning code's maintainer fix it in the same pull request.

### 7. Failure record

Record every remaining failure with its numbers in the family's sub-issue.

### 8. Source citations

Cite each source in the law's documentation and add it to the sub-issue.

## In this repository

### Package owners

The [package boundaries](../project/SKILL.md#packages) say which package owns action content and which owns universal motion primitives, retargeting included. Each algorithm has one owner, so read the owning package before writing a helper.

### Bodies

Verify human motion only on polygon men generated at Human parameters, across the bodies [verification](laws/verification.md) requires, under [human](../human/SKILL.md).

### Studies

Read the relevant action-family issue before authoring. Cite primary sources in the law and issue. The motion families are under #3201 and the grammar and composed families under #3354.

### Lexicon schemas

When changing a lexicon row or law parameters, run `pnpm --filter @automovie/motions schemas`. Commit `HUMAN_LEXICON_SCHEMA_DATA.ts` with the change.

### Checks and capture

The specification tests and the vocabulary's own report of its physical bounds decide whether an action is right here. Run the tests that concern the change by name.

Capture [all cases](laws/verification.md#frame-review) with the motions package's script only when the user asks to see the action. Verify motion by bounded tests and add a check for any visual defect those tests missed.