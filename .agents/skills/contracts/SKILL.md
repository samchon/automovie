---
name: contracts
description: Defines the implementation acknowledgments that maintained source declarations answer with @evidence tags, in three layers of checklist chapters: common engineering principles, modeling principles and anatomical principles for human forms. Use when implementing or reviewing maintained source, when enrolling source in a contracts claim, or when writing or revising a checklist chapter. It does not define product requirements, system specifications or a generated production's contract, which the evidence-graph skill and the scaffold's shipped skills own.
---

# Implementation Contracts

Each chapter of a checklist below is a question that a declaration answers about its own implementation, with an `@evidence contracts/<file>.md#<chapter> <reason>` tag in its JSDoc. `@ttsc/evidence` requires one answer per selected declaration and chapter, and the [review skill](../review/SKILL.md) judges whether an answer is true. The human package's `lint.config.ts` owns which declarations answer which checklist.

Product promises and system contracts stay with the [evidence graph skill](../evidence-graph/SKILL.md), and a generated production's contract with the scaffold's shipped `contract` skill.

An answer explains why the approach is appropriate, the assumptions it relies on and any unresolved departure. It does not certify outputs or claim that tests passed, and it states a real limitation instead of declaring compliance. Keep the reason honest under the evidence graph skill's [Author citations](../evidence-graph/SKILL.md#author-citations). Use `@evidenceExclude` only for a chapter that does not apply, naming that chapter, because excluding a whole checklist file would bypass every chapter in it.

Meet every applicable chapter together. No chapter permits weakening supported behavior to satisfy another. Types and functions are selected, and private helpers are reviewed with their owner.

## [Common Implementation Principles](common.md)

Principled implementation, clear and simple design, prohibited shortcuts and meaningful documentation. Every enrolled declaration answers these.

## [Modeling Principles](modeling.md)

Part identity and grouping, parameter channels, emitted geometry, spatial conventions and shared boundaries. Read when the declaration defines, builds or measures a form.

## [Anatomical Principles](anatomy.md)

Anatomical source, permitted range and parametric authority. Read when the declaration stands for a living human body.

## Maintaining the checklists

- Give each question one chapter owner across all three files, and extend the owning chapter instead of adding a second one.
- Keep each chapter an H2 with a stable anchor. The common chapters apply to every enrolled declaration, and every other chapter opens with an `Apply to` sentence.
- Keep links out of the checklist files so each stays readable on its own.
- Write under the [documentation skill](../documentation/SKILL.md) and review a changed checklist under its instruction-diff rounds.
