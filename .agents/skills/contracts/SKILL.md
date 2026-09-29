---
name: contracts
description: Defines the implementation acknowledgments that maintained source declarations answer with @evidence tags, in three layers of checklist chapters: common engineering principles, modeling principles and anatomical principles for human forms. Use when implementing or reviewing maintained source, when enrolling source in a contracts claim, or when writing or revising a checklist chapter. It does not define product requirements, system specifications or a generated production's contract, which the evidence-graph skill and the scaffold's shipped skills own.
---

# Implementation Contracts

A contracts chapter is a question that a declaration answers about its own implementation. The answer is an `@evidence` tag in the declaration's JSDoc, and the checklist reference makes `@ttsc/evidence` require one answer per selected declaration and chapter. The checker confirms that an answer exists. Whether the answer is true is the [review skill's](../review/SKILL.md) work.

Product promises belong in `docs/requirements` and system contracts in `docs/specifications`, under the [evidence graph skill](../evidence-graph/SKILL.md). A generated production's own contract belongs to the scaffold's shipped `contract` skill. A contracts chapter cites neither layer and owns no product behavior.

## Reading order

Read [common.md](common.md) for every enrolled declaration. Add [modeling.md](modeling.md) when the declaration defines, builds or measures a form, and add [anatomy.md](anatomy.md) when it stands for a living human body. Select chapters by what the declaration does.

The layers are additive. Modeling and anatomy chapters ask only what the layer beneath them does not, so a declaration answers each chapter once and never repeats another chapter's argument.

## Ownership

Each chapter owns one question. Revise a checklist so that this table stays true.

| Layer | Chapter | Question owned |
| --- | --- | --- |
| Common | Principled Implementation | Why does the method or value representation establish the required meaning under its stated premises? |
| Common | Clear and Simple Design | Why are the code's responsibilities and structural elements clear and necessary for current requirements? |
| Common | Prohibited Implementation Shortcuts | Does the implementation rely on hardcoding, monkey patching, test-only logic or a compensation for a disproven assumption? |
| Common | Meaningful documentation | What useful information is written for users and maintainers, and does it follow the documentation skill? |
| Modeling | Part Identity and Grouping | Which part or group of the represented form is this, and who owns its shared boundaries, frames and formulas? |
| Modeling | Parameter Channels | Does each channel vary one trait, with a zero neutral, a documented unit and sign, and an explicit pair rule? |
| Modeling | Emitted Geometry | Why does the representation emit this many primitives of each kind? |
| Modeling | Spatial Conventions | In which unit and frame do the values live, and where are they converted? |
| Modeling | Shared Boundaries | What keeps two adjoining parts joined under every admitted configuration? |
| Anatomy | Anatomical Source | Which measurement or study does each value rest on, under what population and conditions, and is the value measured, derived or fitted? |
| Anatomy | Permitted Range | Why is every admitted value and combination one a living body can take? |
| Anatomy | Parametric Authority | Is every input a named measurement, motion or closed choice that cannot address geometry, and how do simple and detailed inputs convert? |

The neighboring boundaries are these. Principled Implementation asks whether a method is valid for the representation it receives, and Anatomical Source asks where the empirical value comes from. Clear and Simple Design asks about the code's responsibilities, and Part Identity and Grouping asks about the represented form's parts. Emitted Geometry asks how much a declaration emits, and the cost of computing it lies outside these chapters. Parameter Channels asks about the form of a channel, and Parametric Authority asks what kind of quantity a human input may be.

## Writing an answer

Explain why the implementation approach is appropriate, the assumptions it relies on and any unresolved departure. Do not certify outputs, list regression cases or claim that tests passed. State an actual limitation, and never declare compliance with a chapter the implementation does not meet. Write the tag as `@evidence contracts/<file>.md#<chapter-anchor> <reason>`, address every fact the chapter asks for, and use `@evidenceExclude` only for a chapter that genuinely does not apply to that declaration, with the reason.

Meet every applicable chapter together. No chapter permits weakening supported behavior to satisfy another.

Select types and functions. A property keeps its native documentation and is covered by its type. Include private helpers when reviewing the owning declaration, so that delegation does not hide an implementation decision.

## Maintaining a checklist

- Keep every chapter an H2 in a checklist document, with a heading whose anchor stays stable. The common chapters apply to every enrolled declaration and say so once in their introduction. Every other chapter opens with an `Apply to` sentence that states which declarations owe it.
- Keep links out of checklist documents so each remains readable on its own. Links belong to this file.
- Give each question one chapter owner. Before adding a chapter, find whether an existing chapter already owns its question and extend that one.
- Write under the [documentation skill](../documentation/SKILL.md), and review a changed checklist under its instruction-diff rounds.

## Enrollment

The human package's `lint.config.ts` owns which declarations answer which layer. Derive each population from a source-tree glob under the [evidence graph skill](../evidence-graph/SKILL.md#derive-the-carrier-population), with the common claim over the whole package and the modeling and anatomy claims over the directories whose declarations do what those layers ask. Verify an enrollment as the [development skill](../development/SKILL.md) requires of a configured check: count what the claim selected, then remove one answer and confirm the check reports it.
