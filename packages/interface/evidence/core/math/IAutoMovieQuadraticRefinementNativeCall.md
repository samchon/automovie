# src/core/math/IAutoMovieQuadraticRefinementNativeCall.ts#IAutoMovieQuadraticRefinementNativeCall

## @evidence contracts/development/design.md#principled-representation

Copies the interior-point solver's report verbatim, so a diagnosis reads what the kernel said rather than a reinterpretation; the one derived value, the gap, is the absolute difference of the two reported objectives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The solver report plus the row count and, on failure, the raw vectors, which is what a failed solve's error message needs to be diagnosed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Records an unsuccessful status as it is, with no promotion, and keeps failed vectors out of the result's primal and dual.

## @evidence contracts/development/common.md#meaningful-documentation

States that the values are the kernel's copied report in the caller's units, that polishing adds no call, that the residuals are not the refinement's measurement, and that failed vectors are diagnostic only; each field states its meaning.
