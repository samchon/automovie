# src/core/math/IAutoMovieQuadraticWorkingSetStep.ts#IAutoMovieQuadraticWorkingSetStep

## @evidence contracts/development/design.md#principled-representation

The fields are the outputs of a null-space method for an equality-constrained quadratic program as Gill and Wong (2014) describe: a feasible point on the affine space, its orthogonal null-space minimizer or an unbounded zero-curvature direction, and least-squares multipliers from the range factor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record carries all three outcomes with nullable fields instead of a union, because the polisher reads `origin` and `normalDual` even when the step also returns a flat direction, and the basis is kept so the polisher can record its working rank.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A failed step reports a named refusal instead of a fallback point, and a flat direction is returned rather than truncated to an invented step length, so the polisher must find a blocking original row itself.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, that it is a candidate the polisher must still admit, which field combination means which outcome, the multiplier indexing and the dependent-row zero, and per member when it is null and what it is paired with.
