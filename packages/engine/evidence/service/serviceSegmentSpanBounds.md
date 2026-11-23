# src/service/serviceSegmentSpanBounds.ts#serviceSegmentSpanBounds

## @evidence contracts/development/implementation.md#principled-implementation

Each consecutive leg's coordinate extrema padded by radius form an AABB enclosing that swept segment; diagonal routing deliberately yields conservative rather than exact circular interference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clash and maintenance checks consume the same per-leg boxes so a polyline does not claim its entire global bounding cuboid.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No route resampling or discipline-specific thickness replaces the authored radius, and fewer than two points expose no measurable span.

## @evidence contracts/development/common.md#meaningful-documentation

Describes world-volume units, per-leg meaning, diagonal conservatism and malformed-route empty behavior delegated to validation.

## @evidence contracts/development/implementation.md#efficient-algorithms

R points emit at most R-minus-one boxes in O(R) time and output space, proportional to the authored route population.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pairwise consumers can reuse these boxes within their call; this query retains no span table across route mutations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every emitted corner is a new scalar record and the caller owns the array, without source-route retention.
