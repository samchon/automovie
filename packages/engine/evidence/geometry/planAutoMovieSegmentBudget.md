# src/geometry/planAutoMovieSegmentBudget.ts#planAutoMovieSegmentBudget

## @evidence contracts/development/implementation.md#principled-implementation

The pixel footprint is the pinhole projection of one metre at the image centre, `H / (2 d tan(θ / 2))`, and the segment count is the least `n` whose chord sagitta `r (1 - cos(π / n))` stays within one pixel's `e = 1 / p`, which `n = ceil(π / acos(1 - e / r))` gives. The half chord angle is evaluated as `2 asin(sqrt(e / (2 r)))`, the identity `1 - cos φ = 2 sin²(φ / 2)`, so a small ratio loses no digits to `1 - e / r`. Where `e` reaches `2r` the angle has no value and the whole section lies within one pixel, so the count takes its floor of 3, the fewest segments that close a section with area. Limits: the footprint is the image centre's, not an edge's under perspective, and a ratio `e / r` that underflows to zero gives an infinite count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, the footprint, then the count, in one function; the skill page's segment budget states the rule and points here, so the arithmetic lives once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fitted constant: the formulas are the issue's closed forms, and the floor of 3 is the triangle, the least closed section. Out-of-domain inputs are refused by name rather than clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the formulas with their units, the stable evaluation, the guard where `e` reaches the diameter, the floor, the refusals and that model primitives keep their fixed segments.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one tangent, one square root and one arcsine.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure closed form per call with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns a new record.
