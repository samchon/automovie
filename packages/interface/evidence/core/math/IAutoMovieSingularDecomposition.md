# src/core/math/IAutoMovieSingularDecomposition.ts#IAutoMovieSingularDecomposition

## @evidence contracts/development/design.md#principled-representation

Separates original-design singular factors from an operational numerical-rank cutoff; small singular values are retained rather than replaced by eigenvalues of a squared-condition normal matrix.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Column storage matches the rotations and lets consumers use right null vectors without transposition or a separate factorization.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No covariance, full relative-accuracy guarantee or exact algebraic rank is inferred from a floating cutoff.

## @evidence contracts/development/common.md#meaningful-documentation

Gives factor orientation, ordering, unresolved small-column orthogonality and the meaning of the measured residual.
