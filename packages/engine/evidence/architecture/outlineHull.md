# src/architecture/outlineHull.ts#outlineHull

## @evidence contracts/development/implementation.md#principled-implementation

Half-turn-limited outward arcs expand to their chord/sagitta rectangle. Inward arcs retain the chord as the outer boundary of the void, avoiding an undersized inset rectangle. Signed chord-ring area determines the inward side; zero-area rings retain the existing arc rectangle rule. Building validation admits finite bounded bulges, nonzero chords and a simple resulting hull; it does not separately certify circular-arc simplicity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One arc-bounding rule shared by building validation, wall cutting, observation stations, opening extents and service validation, so every consumer measures an arched void the same way.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The inward/outward decision uses winding and bulge sign for every profile, with no shape catalogue or sampling. Straight and inward edges preserve their original corners; no self-crossing input is repaired by a convex hull.

## @evidence contracts/development/common.md#meaningful-documentation

States the two arc directions, zero-area chord policy, sagitta rectangle, conservative overestimate, validation and circular-simplicity limits, borrowed original corners, planar frame and output order.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n corners, winding and edge construction cost O(n) time with at most 3n output points. Winding is needed only when a nonzero bulge is stated; each expanded arc uses one chord length and normal offset.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure transformation of one profile that coordinates no work across requests; building validation computes each hull once and passes it to the overlap and panel-fit checks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned ring of at most 3n points, which the caller owns; nothing else outlives the call.
