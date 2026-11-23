# src/architecture/pointInPolygon.ts#pointInPolygon

## @evidence contracts/development/implementation.md#principled-implementation

Applies the shared boundary predicate, then even-odd ray crossing with a half-open y test to avoid counting a ray vertex twice. The intended premise is a finite simple ring and finite computed intersections; this function does not validate it, and binary64 arithmetic and boundary tolerance do not provide an exact-predicate guarantee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single planar containment test in the engine: polygon containment, polygon overlap and footprint-ring placement call it, and its edge test is the shared `pointOnSegment` rather than a private copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No figure, coordinate or caller is special-cased; boundary points are inside by the stated rule, not by an adjustment for any one consumer.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the boundary rule and its tolerance, the ring convention and winding freedom, the self-crossing and empty cases, and who relies on it.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two passes over n edges, O(n) time and O(1) space, with immediate return on a boundary hit. Boundary and parity work could also be combined; the separate passes keep the two rules explicit.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure query over one point and one ring that coordinates no work across requests; a caller testing many points against one ring owns any indexing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps a loop index and one parity flag for the call and allocates nothing, so nothing outlives it.
