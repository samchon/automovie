# src/geometry/IAutoMoviePlanContourWalks64Ring.ts#IAutoMoviePlanContourWalks64Ring

## @evidence contracts/development/common.md#meaningful-documentation

The ring documents stable planner identity and its shared evolving point array.

## @evidence contracts/development/design.md#principled-representation

Preparation uses the ID in its ordered cache key. Resolution builds a per-ring identity-to-index map over the final cyclic order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This view carries only the identity and cyclic samples needed by slit walks. Source phase lookup and evaluation remain supplied callbacks.

# src/geometry/IAutoMoviePlanContourWalks64Ring.ts#IAutoMoviePlanContourWalks64Ring.id

## @evidence contracts/development/common.md#meaningful-documentation

The stable unique ID participates in the selection's ordered cache key.

# src/geometry/IAutoMoviePlanContourWalks64Ring.ts#IAutoMoviePlanContourWalks64Ring.points

## @evidence contracts/development/common.md#meaningful-documentation

The borrowed cyclic millimetre array supports refinements before resolution caches source point indices.
