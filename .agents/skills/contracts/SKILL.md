---
name: contracts
description: Defines the implementation acknowledgments that maintained source declarations answer with @evidence tags, in three layers of checklist chapters: common engineering principles, modeling principles and anatomical principles for human forms. Use when implementing or reviewing maintained source, when enrolling source in a contracts claim, or when writing or revising a checklist chapter. It does not define product requirements, system specifications or a generated production's contract, which the evidence-graph skill and the scaffold's shipped skills own.
---

# Implementation Contracts

A declaration answers each chapter its package's `evidence.config.ts` selects with `@evidence contracts/<file>.md#<chapter> <reason>` in JSDoc. The [review skill](../review/SKILL.md) judges whether the answers are true. Changing the selection requires a separately verified configuration change.

Product promises and system contracts belong to the [evidence graph skill](../evidence-graph/SKILL.md), and a generated production's contract to the scaffold's shipped `contract` skill.

## Answering a chapter

- State why the approach fits, its assumptions and any unresolved departure, specific to the declaration's responsibility. Do not certify outputs or claim that tests passed.
- Answer only finished work. An open chapter stays unanswered as the todo, and open defects go to the issue or worklog, because a status comment in source goes stale.
- Keep the reason honest under the evidence graph skill's [Author citations](../evidence-graph/SKILL.md#author-citations).
- Use `@evidenceExclude` only for a chapter that does not apply, naming that chapter. Excluding a whole file bypasses every chapter in it.
- Meet every applicable chapter together. No chapter permits weakening supported behavior to satisfy another.
- Assign part, parameter, range, conversion, boundary and assembly claims to their actual owners. Transports and helpers preserve the owner's meaning and repeat no research or whole-render judgment they do not perform. Review private helpers with their owner.

## [Common Implementation Principles](common.md)

Every maintained declaration.

## [Modeling Principles](modeling.md)

Declarations that define, build or measure a form: parts, channels, emitted geometry, frames, boundaries and rendered observation.

## [Anatomical Principles](anatomy.md)

Declarations that stand for a living human body: sources, ranges and public inputs.

## Maintaining the checklists

- Give each question one chapter owner across the three files, and extend that chapter instead of adding a second.
- Keep each chapter an H2 with a stable anchor, because the H2 is the checklist item the configuration selects. Modeling and anatomy chapters open with an `Apply to` sentence.
- Keep links out of the checklist files so each reads on its own.
- Write and review a changed checklist under the documentation skill's [instructions document](../documentation/instructions.md).
