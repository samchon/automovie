# src/observation/observeAutoMovieRecoveryPolyline.ts#observeAutoMovieRecoveryPolyline

## @evidence contracts/development/implementation.md#principled-implementation

The maintained Schneider-style two-handle solver owns fitting; the shared converter derives Hermite values with each fitted span's physical parameter width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This public entry admits explicit feature input and delegates numerical fitting and basis conversion without adding another solver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source-face fallback, inferred point ordering, curve closure, degree reduction or tolerance relaxation is performed.

## @evidence contracts/development/common.md#meaningful-documentation

States caller correspondence, units, G1 limitation, finite-polyline scope and cooperative checkpoints.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N observations and S spans, delegated fitting costs balanced O(N log S), worst-case O(N squared), with O(N+S) live storage; conversion adds O(S).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One fit supplies coefficients and diagnostics; one basis conversion supplies the returned coefficient authority without a cross-call cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inputs remain borrowed; solver copies and conversion maps expire on return or failure, and only source-free coefficients and scalars transfer to the caller.
