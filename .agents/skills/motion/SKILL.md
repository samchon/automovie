---
name: motion
description: Defines how body motion is authored and verified in this repository, centred on effector goals and action laws, and owns the shared motion rules productions receive. Use when authoring or verifying body motion, the motions vocabulary, a human action law, an engine motion primitive or retargeting, or a motion capture verdict.
---

# Motion

This repository develops the motion vocabulary that productions install. A production composes its actions, writes a law of its own only for an action the vocabulary lacks, and reports a defect in a shipped action back here. So an action here is finished only when it works for any body and any partner without a production patching it.

Author every action by [effector goals](authoring.md), the rule the rest depends on. Then follow, as the work needs:

| Rule | Covers |
| --- | --- |
| [Laws](laws.md) | What every action declares, from its plan and entry state to its events, outcome and time scale |
| [Variation](variation.md) | Parameters, skill and seed, and draws that replay |
| [Transitions](transitions.md) | Pose as a function of time, declared cuts, inertialization and redirection |
| [Contacts](contacts.md) | Support frames, feet, held objects and contact between performers |
| [Layers](layers.md) | Gaze, breathing and other motion that runs over every action |
| [Verification](verification.md) | Bounded checks, body sweeps and frame review |

Those seven files ship unchanged to productions, so they name roles rather than this repository's packages and paths. This file holds what applies only here.

## Adding an action

Work in this order, because each step fixes what the next one builds on:

1. Read the action family's sub-issue and its primary sources.
2. Declare the law's surface under [laws](laws.md).
3. Write the plan as [effector goals](authoring.md) with their [contact windows](contacts.md).
4. Declare the [interrupt table](transitions.md#declared-cuts) in both directions.
5. Give the action isolated cases with bounded checks under [verification](verification.md).
6. Capture the cases, review their frames, and repair every finding of the round together by cause.
7. Cite each source in the law's documentation and add it to the sub-issue.

The study gives the shape prior, the phases with their timing, and the measured values at novice and expert level. An action written before its study invents the practice.

The surface is the law's parameters and targets, its events and decisive instant, its outcomes and its [out-of-reach rule](authoring.md#decide-what-happens-out-of-reach). The plan starts from the entry state and takes every quantity that varies from [skill and seed](variation.md).

Both directions of the interrupt table means the actions this one may be cut into, and this action as a cut target in the tables of the actions that lead into it.

The cases run across bodies, against partners and props, cut at each listed window and redirected mid-motion, because films use a law where it is interrupted.

## Here

### Package owners

The [package boundaries](../project/SKILL.md#packages) say which package owns action content and which owns universal motion primitives, retargeting included. Each algorithm has one owner, so read the owning package before writing a helper; a second copy drifts from the first and leaves two bugs to fix.

### Bodies

Verify human motion only on polygon men generated at Human parameters, across the bodies [verification](verification.md) requires, under [human](../human/SKILL.md).

### Studies

An action's study is the primary sources its law cites in its documentation. Each action family's sub-issue of the motions campaign, #3201, collects them with the family's scope and current state. Read the sub-issue before authoring and add the sources you use there, so the next author starts from them.

### Capture

The motions package's capture script runs the cases. A capture reports a failed verdict through its exit status, not a crash, and CI skips the tests that prepare polygon men, so run those locally.
