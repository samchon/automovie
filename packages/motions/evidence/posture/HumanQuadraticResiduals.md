# src/posture/HumanQuadraticResiduals.ts#HumanQuadraticResiduals

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates Ax-z and Px+q+A-transpose-y infinity norms in scaled and original units, with the existing D/E/c reversal and arithmetic association from Stellato et al. 2020 section 3.4.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns residual measurement separately from Band factorization/polishing; one ordered row pass supplies Ax and A-transpose-y, then the existing curvature owner supplies Px.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every norm, normalization and finite-result decision. Nonfinite operands restore actual zero products in original order rather than hiding them, inventing a NaN or rejecting a genuinely empty row.

## @evidence contracts/development/implementation.md#efficient-algorithms

Normal checks cost O(n+Z+m+n*w), with exact diagonal finite-x curvature reducing n*w to n; supplied products cost O(m+n*w). Exceptional products may visit R original entries and lazily allocate their restored rows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses unchanged inverse dual scales/q norms and same-call absolute row/dual errors and magnitudes. Positive E and nonnegative 1/(cD) move only sign removal across division/multiplication, preserving exact rounded magnitudes and zero/infinite/NaN results. Immediate polishing products/finite-x proof require unchanged x/y/A; other products recompute with immutable exceptional layouts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Products and diagnostics belong to the supplied workspace; accepted scalars are copied before reuse, and restored rows release with their one-shot wrapper or fixed model without entering public state or numeric preparation.

## @evidence contracts/development/common.md#meaningful-documentation

Defines residual equations, units, producer-supplied-product premise, IEEE-754 exceptional path, dimensions and borrowed result lifetime.
