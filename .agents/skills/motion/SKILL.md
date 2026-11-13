---
name: motion
description: Defines how body motion is designed, authored and verified in this repository, centered on interaction as end-effector goals and on action laws, and owns the shared motion rules productions receive. Use when authoring or verifying body motion, the motions vocabulary, a human action law, an engine motion primitive or retargeting, or a motion capture verdict.
---

# Motion

This repository develops the motion vocabulary: the actions productions install and the grammar that joins them. A production composes its actions, registers one of its own only where the vocabulary lacks it, and reports a defect in a shipped action back here. So an action here is finished only when it works for any body, any partner and any composition without a production patching it.

The goal is that composition expresses every act a human body performs. The shipped actions are a floor, and no kind of human motion is out of scope.

Motion starts from interaction: the body acting on the floor, a prop, a partner or a point it aims at. An action is written as a law, a function that, given a body and its inputs, produces the same motion every time. Each rule file covers one part of designing or checking a law:

| Rule | Covers |
| --- | --- |
| [Effector goals](authoring.md) | Interaction as end-effector goals on targets: reach, balance, the path in time and the order of the fits. Every other rule depends on it |
| [Laws](laws.md) | What every action declares: its plan, entry state, events, outcome and time scale |
| [Variation](variation.md) | Parameters, skill and seed, and draws that replay |
| [Transitions](transitions.md) | Pose as a function of time, declared cuts, inertialization and redirection |
| [Contacts](contacts.md) | Support frames, feet, held objects and contact between performers |
| [Layers](layers.md) | Gaze, breathing and other motion that runs over every action |
| [Verification](verification.md) | Bounded checks, body sweeps and frame review |

Those files hold only what is true of motion in any project and name roles rather than this repository's packages and paths, because the shared ones ship to productions unchanged. This file holds what applies only here.

## Choosing the form {#choosing-the-form}

Take the first form that expresses the act, because each later one writes more motion that must then be fitted, refused and checked anew.

1. A composition of shipped actions through the grammar's operators.
2. A row: a shipped action under a name of its own with some parameters fixed. It writes no motion, so it is fitted, refused and checked as its action is.
3. An entry in the data table of the action that owns the family.
4. A law of its own, for an act that owns what no shipped action plans: a change of what carries the body, an outcome between performers, or a planner of its own. It is composed from the vocabulary's own kernel of a clock, a base and part movements, so it inherits its supports and can be performed over another action.

The motions package's README shows each form.

An act that needs a missing axis or operator, such as a new kind of support, effector or join, is a change to the grammar. Make it once in the grammar's owner, never inside one action.

## Adding an action

Work in this order, because each step fixes what the next one builds on.

1. Read the action family's [study](#studies).

   The study gives the key poses, the phases with their timing, and the measured values at novice and expert level. An action written before its study invents the practice.

2. Declare the law's surface under [laws](laws.md).

   The surface is the law's parameters and targets, its events and decisive instant, its outcomes and its [out-of-reach rule](authoring.md#decide-what-happens-out-of-reach).

3. Write the plan as [effector goals](authoring.md) with their [contact windows](contacts.md).

   The plan starts from the entry state and takes every quantity that varies from [skill and seed](variation.md).

4. Declare the action's [cuts](transitions.md#declared-cuts) in both directions.

   One direction is the actions this one may be cut into. The other is this action as a cut target, among the cuts of the actions that lead into it.

5. Specify the action in tests with bounded checks under [verification](verification.md).

   A test states what a person does with a number from the study, never what the code returned. Use few tests that cover widely: a covering set of bodies, variants and supports, and relations that must hold between two runs.

6. Run the tests and repair every finding of the round together by cause.

   A specification that fails on a defect outside the change stays in the feature tests, failing, with its measured numbers in its document and on the owning issue. The owner of the defective code fixes it in the same pull request. No specification is parked in a folder apart.

7. Record every remaining failure with its numbers in the family's sub-issue.
8. Cite each source in the law's documentation and add it to the sub-issue.

## In this repository

### Package owners

The [package boundaries](../project/SKILL.md#packages) say which package owns action content and which owns universal motion primitives, retargeting included. Each algorithm has one owner, so read the owning package before writing a helper; a second copy drifts from the first and leaves two bugs to fix.

### Bodies

Verify human motion only on polygon men generated at Human parameters, across the bodies [verification](verification.md) requires, under [human](../human/SKILL.md).

### Studies

An action's study is the primary sources its law cites in its documentation. Each action family's sub-issue collects them with the family's scope, acceptance and current state: the families of the motions campaign under #3201, and the grammar, its axes and the composed families under #3354. Read the sub-issue before authoring and add the sources you use there, so the next author starts from them.

### Checks and capture

The specification tests and the vocabulary's own report of its physical bounds decide whether an action is right here. Run the tests that concern the change by name.

[Verification](verification.md#look-at-the-frames) also reviews stills of every case. In this repository that review happens only when the user asks to see an action, because the user holds motion by tests and forbids launching a viewer or a capture otherwise. So a defect a still would have shown must be caught by a bounded check: when one slips through, add the check that would have caught it.

The motions package's capture script draws the cases when the user asks.