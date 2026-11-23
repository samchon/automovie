# src/geometry/curve/compileAutoMovieNormalizedPhases64.ts#compileAutoMovieNormalizedPhases64

## @evidence contracts/development/implementation.md#principled-implementation

Positive cumulative widths define an ordered normalized partition; the existing 64*n-epsilon total-sum allowance covers phase summation only, not geometric distances or denominator positivity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission owner supplies the same canonical knots to curve evaluation and exact span readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No width rescaling, geometric projection or epsilon denominator is introduced; nonpositive or unrepresentable intervals reject.

## @evidence contracts/development/common.md#meaningful-documentation

States normalized phase units, cumulative representability and terminal-only roundoff absorption.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(n) pass creates n+1 scalar knots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumers retain the admitted knots for repeated point and exact-span queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the new knot array escapes; no input or global cache is retained.
