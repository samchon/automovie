# src/worldSurfaceContains.ts#worldSurfaceContains

## @evidence contracts/development/implementation.md#principled-implementation

The boundary is tested first by plan distance to each edge through `closestPointOnSegmentXZ`, then the interior by the even-odd ray-crossing rule with the half-open `z` test, which counts a vertex on the ray once; the 1e-9 m band is far below any authored footprint and absorbs coordinates that were computed rather than typed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One footprint containment rule for the world, shared by the ground oracle `worldGroundSurface` and the placement gate `assertWorldPlacements`, which previously kept identical private ray-casts and distance helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No surface or coordinate is special-cased; edge points count as inside by the stated floor-edge rule for every caller.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the ring convention, the edge rule with its tolerance and reason, the interior rule, the self-crossing and empty cases, that height is ignored, and the units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two passes over the n footprint edges, O(n) time and O(1) space, returning early on an edge hit; an unindexed ring needs a full scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure query over one point and one footprint that coordinates no work across requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one closest-point record per edge test and retains nothing after returning.
