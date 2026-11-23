# src/architecture/IAutoMovieDesignDecision.ts#IAutoMovieDesignDecision

## @evidence contracts/development/design.md#principled-representation

Options resolve to at least two distinct variants on one recorded revision base; selected is null or one option. All same-kind artifacts stamped with an option share recorded configuration digest and phase, including multiple artifacts of the same option. This is metadata comparability: the gate does not recompute configurations, inspect outputs or prove their actual differences arise only from variants, and it does not require every option to have an artifact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A decision references variants by id and records the choice as one nullable id, leaving each alternative's changes on its variant, so selecting never copies or moves design data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rejected options are kept rather than pruned, and a selection outside the options or a mixed-revision option list is refused instead of being coerced.

## @evidence contracts/development/common.md#meaningful-documentation

States that selection keeps the rejected options, the shared configuration and phase rule for derived artifacts, the at-least-two, distinct, and one-revision option rules, the non-blank question, and what a null selection means.
