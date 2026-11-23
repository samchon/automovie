# src/math/refineAutoMovieQuadraticProgram.ts#refineAutoMovieQuadraticProgram

## @evidence contracts/development/implementation.md#principled-implementation

Original feasibility, stationarity and signed complementarity admit polished diagonal QPs; exact coefficient groups intersect intervals without deleting constraints, and correction never promotes native status.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The refiner owns original residual formulas and adoption, while the polisher owns correction and the native solver remains a single preceding call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No extra native solve, objective amplification or tolerance relaxation hides failure; rejected attempts retain original values and their actual diagnostics.

## @evidence contracts/development/common.md#meaningful-documentation

States original-coordinate adoption, unchanged status/budget, exact grouping, rejected diagnostics and limits of numerical or geometric certification.

## @evidence contracts/development/implementation.md#efficient-algorithms

Grouping sorts each sparse row, and residual measurements cost O(Z plus N) for Z coefficients and N variables; the polisher adds explicitly budgeted work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exact coefficient copies share interval metadata and endpoint owners, while every residual rereads original rows; no solve result survives changed coefficients.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result owns copied vectors, row groups and bounded attempt traces; grouping maps and measurement buffers are temporary and no native workspace is acquired here.
