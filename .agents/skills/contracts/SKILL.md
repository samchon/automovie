---
name: contracts
description: Defines the implementation acknowledgments that maintained source declarations answer with @evidence tags, in three layers of checklist chapters: common engineering principles, modeling principles and anatomical principles for human forms. Use when implementing or reviewing maintained source, when enrolling source in a contracts claim, or when writing or revising a checklist chapter. It does not define product requirements, system specifications or a generated production's contract, which the evidence-graph skill and the scaffold's shipped skills own.
---

# Implementation Contracts

The common principles govern implementation and review. Modeling and anatomy chapters ask the declarations that own those responsibilities for concrete grounds, carried by `@evidence contracts/<file>.md#<chapter> <reason>` in JSDoc. The owning package's `evidence.config.ts` selects standalone checklist obligations, and the [review skill](../review/SKILL.md) judges their truth. Selected chapters still require an answer; keep it specific to the declaration's responsibility instead of repeating generic self-assessments. Changing those obligations requires a separately verified configuration change.

Product promises and system contracts stay with the [evidence graph skill](../evidence-graph/SKILL.md), and a generated production's contract with the scaffold's shipped `contract` skill.

An answer explains why the approach is appropriate, the assumptions it relies on and any unresolved departure. It does not certify outputs or claim that tests passed, and it states a real limitation instead of declaring compliance. Answer only what has been done: a chapter whose work is still open stays unanswered, and the missing answer is the todo. Keep open defects in the task's issue or worklog and never in the declaration, because a status comment goes stale. Keep the reason honest under the evidence graph skill's [Author citations](../evidence-graph/SKILL.md#author-citations). Use `@evidenceExclude` only for a chapter that does not apply, naming that chapter, because excluding a whole checklist file would bypass every chapter in it.

Meet every applicable chapter together. Assign part, parameter, range, conversion, boundary and assembly claims to their actual owners. Transport and helpers preserve those owners' meaning and do not repeat anatomical research or whole-render judgments they do not perform. Selection and chapter exclusions must follow that responsibility, while unfinished owner work remains visible. No chapter permits weakening supported behavior to satisfy another. Review private helpers with their owner.

## [Common Implementation Principles](common.md)

Principled implementation, clear and simple design, prohibited shortcuts and meaningful documentation. Apply these to every maintained declaration and record nonobvious grounds where the responsibility is defined.

## [Modeling Principles](modeling.md)

Part identity and grouping, parameter channels, emitted geometry, spatial conventions, shared boundaries and rendered observation. Read when the declaration defines, builds or measures a form.

## [Anatomical Principles](anatomy.md)

Anatomical source, permitted range and parametric authority. Read when the declaration stands for a living human body.

## Maintaining the checklists

- Give each question one chapter owner across all three files, and extend the owning chapter instead of adding a second one.
- Keep each chapter an H2 with a stable anchor. Common principles apply to every maintained declaration; modeling and anatomy chapters open with an `Apply to` sentence.
- Keep links out of the checklist files so each stays readable on its own.
- Write and review a changed checklist under the documentation skill's [instructions document](../documentation/instructions.md).
