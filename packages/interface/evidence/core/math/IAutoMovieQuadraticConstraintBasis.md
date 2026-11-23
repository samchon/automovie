# src/core/math/IAutoMovieQuadraticConstraintBasis.ts#IAutoMovieQuadraticConstraintBasis

## @evidence contracts/development/design.md#principled-representation

Records a rank-revealing QR of the normalized working normals, which yields orthonormal range and null-space bases and a minimum-norm particular solution without forming `A·Aᵀ`; the rank test is a dimension-scaled binary64 threshold, and an ambiguous rank is refused rather than guessed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Holds exactly what the working-set step reads: the pivot order and divisors to map multipliers back to rows, `R` to solve with, the two bases and the particular point, plus the rank reading and merged rows for diagnostics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only exact zero-singleton repeats and tautological zero rows are merged; every other dependence is reported through `refusal`, and no row or caller is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the equations and factorization, how rows are identified, which rows may be merged, what a refusal means for the other fields, and ownership.
