# src/harness/IAutoMovieReviewNote.ts#IAutoMovieReviewNote

## @evidence contracts/development/design.md#principled-representation

A note is located by beat and tier and carries the observed defect and the change to make, the two texts a correction round needs; the production store refuses blank beat, issue or suggestion instead of persisting an unlocated correction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields share correction structure between visual grammar findings and persisted review notes, so each producer supplies the same located correction without per-reviewer payloads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Grammar adaptation drops severity and shot fields and relies on the supplied beat to preserve location; storage accepts a structurally valid note without proving beat membership, review provenance or the truth of its text. Numerical proxy findings remain claims for a reviewer, with no text-quality grade.

## @evidence contracts/development/common.md#meaningful-documentation

States who files notes and through which gate, which tier the engine uses and for what, and every refusal; members give the beat rule, the tier meanings, and what the two texts must say.
