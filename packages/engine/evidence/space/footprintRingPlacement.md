# src/space/footprintRingPlacement.ts#footprintRingPlacement

## @evidence contracts/development/implementation.md#principled-implementation

A nearest-segment distance of at most 1e-9 metres answers boundary before the shared parity predicate; that predicate also has scale-relative edge tolerance, so inside is not an exact-real classification for every finite coordinate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Ring classification owns the three outcomes while polygon parity and segment projection retain their canonical numerical owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fewer than three points answer outside; other malformed or numerically unrepresentable inputs are not repaired and can fail in the segment owner.

## @evidence contracts/development/common.md#meaningful-documentation

Documents horizontal coordinates, rim precedence, short-ring behavior and the distinct fixed-rim and parity tolerances.

## @evidence contracts/development/implementation.md#efficient-algorithms

E edges take O(E) worst-case distance and parity work with constant live query storage; rim discovery short-circuits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ring's prepared plan is reused, while the query's projections are calculated afresh; no mutable geometry result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned literal escapes; the borrowed ring and call-local probe acquire no retained host resources.
