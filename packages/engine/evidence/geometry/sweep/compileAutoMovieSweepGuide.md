# src/geometry/sweep/compileAutoMovieSweepGuide.ts#compileAutoMovieSweepGuide

## @evidence contracts/development/implementation.md#principled-implementation

Wraps a finite angle modulo one turn and delegates the positive radius domain to the shared scalar profile compiler.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns guide admission separately from Gordon row composition and station/feature evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses invalid values without clamping radii, sorting knots or treating one consumer differently.

## @evidence contracts/development/common.md#meaningful-documentation

States angle wrapping, positive profile ownership and refusal behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant angle work plus the shared K-knot profile compilation; queries retain its O(log K) evaluation cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned guide retains one compiled scalar profile reused by every row query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers one closure with O(K) spline coefficients and a diagnostic name to the sweep, released with that sweep.
