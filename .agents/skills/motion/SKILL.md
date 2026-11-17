---
name: motion
description: Sets how body motion is designed, authored and verified in this repository.
---

# Motion

This repository develops the motion vocabulary: the actions productions install and the grammar that joins them. A production composes its actions and registers one of its own only where the vocabulary lacks it. So an action here is finished only when it works for any body, any partner and any composition without a production patching it.

The goal is that composition expresses every act a human body performs. The shipped actions are a floor, and no kind of human motion is out of scope.

Motion starts from interaction: the body acting on the floor, a prop, a partner or a point it aims at. An action is written as a law, and [laws](laws/SKILL.md) holds the rules for designing and checking one in any project. This file holds what applies only here.

## Choosing the form

Take the first form that expresses the act, because each later one writes more motion that must then be fitted, refused and checked anew.

1. A composition of shipped actions through the grammar's operators.
2. A row: a shipped action under a name of its own with some parameters fixed.
3. An entry in the data table of the action that owns the family.
4. A law of its own, for an act that owns what no shipped action plans.

A row writes no motion, so it is fitted, refused and checked as its action is. An act owns what no shipped action plans when it changes what carries the body, decides an outcome between performers, or needs a planner of its own. Its law is composed from the vocabulary's own kernel of a clock, a base and part movements, so it inherits its supports and can be performed over another action. The motions package's README shows each form.

An act that needs a missing axis or operator, such as a new kind of support, effector or join, is a change to the grammar. Make it once in the grammar's owner, never inside one action.

## Adding an action

Work in the order below, because each step fixes what the next one builds on.

### 1. Source reading

Read the action family's study. The study gives the key poses, the phases with their timing, and the measured values at novice and expert level. An action written before its study invents the practice.

### 2. Law surface

Declare the law's surface under [law design](laws/declaration.md). The surface is the law's parameters and targets, its events and decisive instant, its outcomes and its [out-of-reach rule](laws/authoring.md#out-of-reach).

### 3. Goal plan

Write the plan as [effector goals](laws/authoring.md) with their [contact windows](laws/contacts.md). The plan starts from the entry state and takes every quantity that varies from [skill and seed](laws/variation.md).

### 4. Declared cuts

Declare the action's [cuts](laws/transitions.md#declared-cuts) in both directions: the actions this one may be cut into, and this action as a target among the cuts of the actions that lead into it.

### 5. Test specification

Specify the action in tests with bounded checks under [verification](laws/verification.md). A test states what a person does with a number from the study, never what the code returned.

Use few tests that cover widely: a covering set of bodies, variants and supports, and relations that must hold between two runs.

### 6. Test run and fixes

Run the tests and fix the round's findings by cause, as the repository's AGENTS.md requires.

A specification that fails on a defect outside the change stays in the feature tests, failing, with its measured numbers in its document and on the owning issue. The owner of the defective code fixes it in the same pull request. No specification is parked in a folder apart.

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

An action's study is the primary sources its law cites in its documentation. Each action family's sub-issue collects them with the family's scope, acceptance and current state: the families of the motions campaign under #3201, and the grammar, its axes and the composed families under #3354. Read the sub-issue before authoring and add the sources you use there.

### Lexicon schemas

Whoever adds a lexicon row or changes a law's parameters runs `pnpm --filter @automovie/motions schemas` and commits the regenerated `HUMAN_LEXICON_SCHEMA_DATA.ts` in the same commit, because every action's parameters are checked against it at its entry, the website reads it, and CI fails on a stale one.

### Checks and capture

The specification tests and the vocabulary's own report of its physical bounds decide whether an action is right here. Run the tests that concern the change by name.

[Verification](laws/verification.md#frame-review) also reviews stills of every case. Here that review happens only when the user asks to see an action, because the user holds motion by tests and forbids launching a viewer or a capture otherwise; the motions package's capture script then draws the cases. A defect a still would have shown must therefore be caught by a bounded check: when one slips through, add the check that would have caught it.