# src/architecture/IAutoMovieDesignChange.ts#IAutoMovieDesignChange

## @evidence contracts/development/design.md#principled-representation

Equality of two alternatives' edits is exact string equality on the authored value keyed by subject and aspect, and the view digest hashes length-prefixed subject, aspect, and value fields so no authored text can forge a separator.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A subject, an aspect, an opaque value, and a rationale are all lineage needs to compare and digest alternatives, so it carries no patch schema for graphs it does not own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The value is never parsed or normalized, so two spellings of one setting read as a difference, which is the stated cost of verbatim comparison rather than a hidden heuristic.

## @evidence contracts/development/common.md#meaningful-documentation

States why the value is a string, that it is compared verbatim and never applied, the id's uniqueness scope, that subject resolves, that aspect and rationale are non-blank, and the once-per-subject-and-aspect rule.
