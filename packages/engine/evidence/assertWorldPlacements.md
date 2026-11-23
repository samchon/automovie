# src/assertWorldPlacements.ts#assertWorldPlacements

## @evidence contracts/development/implementation.md#principled-implementation

Block overlap is the strict axis-aligned box interval test, so touching faces pass; support is corner containment plus the fact that a notch of a simple polygon cutting a rectangle must put a vertex strictly inside it or properly cross one of its edges; route clearance is the Liang-Barsky slab clip of each segment against the padded footprint; landmark reach is plan point-to-segment distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One gate owns world-layout contradictions; footprint containment is the shared `worldSurfaceContains` the ground oracle also reads, proper crossing is the architecture `segmentsCross` predicate, and plan distance uses `closestPointOnSegmentXZ`, replacing the private copies this file kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No block kind, surface or landmark is special-cased; a landmark on a walkable edge passes by the same floor-edge rule the ground oracle applies, and the first contradiction is thrown rather than collected because the builder cannot proceed past any of them.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every rule, the units and axes, the box and plan assumptions, the support tolerance, the edge rule, the check order, and that only the first contradiction is reported.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B² + B·S·n + R·B + L·(S·n + R)) for B blocks, S surfaces of up to n corners, R route segments and L landmarks; pairwise block tests and per-segment scans use no spatial index.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A one-shot gate over one world layout that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only per-test footprint corners and closest points and retains nothing; it returns nothing and throws on the first contradiction.
