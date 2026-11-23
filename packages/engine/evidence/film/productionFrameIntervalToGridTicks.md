# src/film/productionFrameIntervalToGridTicks.ts#productionFrameIntervalToGridTicks

## @evidence contracts/development/implementation.md#principled-implementation

Maps each boundary of the half-open interval independently with the exact boundary map, so the tick interval is the image of the frame interval and neighbours meet on one tick; a collapse to an empty tick interval is refused because the half-open form would otherwise deliver nothing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The interval form of the boundary map used by WebVTT captions and production sound, keeping the collapse refusal in one place instead of in each consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A collapsed interval is refused rather than widened to one tick, which would shift its neighbour and break the tiling.

## @evidence contracts/development/common.md#meaningful-documentation

States that both ends share one rounding and why that tiles the clock, the half-open convention, both refusals and why a collapse is refused, and that boundary errors pass through.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: two boundary conversions and two comparisons.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one interval; a caller tiling many intervals maps each shared boundary twice, two constant-time conversions that need no cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned pair.
