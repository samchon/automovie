# src/space/footprintInteriorPoint.ts#footprintInteriorPoint

## @evidence contracts/development/implementation.md#principled-implementation

The largest absolute shoelace area wins, with first-piece ties, and its vertex mean lies in that convex piece under representable arithmetic; decomposition preserves admitted positive bands, while binary64 orientation/interpolation still limit extreme coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The anchor owner composes the canonical decomposition and ring-area owners rather than averaging a concave outer ring into a notch or hole.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absence of a positive measured piece returns null; no fallback center is invented. Direct area/coordinate sums can overflow, so finite authored coordinates alone do not establish a valid returned anchor.

## @evidence contracts/development/common.md#meaningful-documentation

Documents nullable anchor, widest-piece/first-tie selection and the remaining dependency on decomposition fidelity rather than claiming unconditional admitted-region containment.

## @evidence contracts/development/implementation.md#efficient-algorithms

The full decomposition cost precedes one scan of returned vertices for piece areas and one scan of the winning piece for its mean; the decomposition allocation dominates storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One completed decomposition serves area ranking and anchor selection within the call; no stale mutable-footprint anchor cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh scalar point or null; piece populations and temporary sums leave scope, with no source mutation or external resource acquisition.
