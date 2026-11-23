# src/film/intersectsPerspectiveFrustumBox.ts#intersectsPerspectiveFrustumBox

## @evidence contracts/development/implementation.md#principled-implementation

The edge-crossing criterion for two convex polyhedra: box edges are clipped by Cyrus-Beck against the frustum planes in camera space, and frustum edges by slab clipping against the box in world space, which together give the exact-real criterion for a non-degenerate pair. Finite ordered bounds, a valid lens, nearly unit camera rotation and representable intermediates are premises; binary64 rounding at boundaries is not a certified enclosure or rendered-pixel proof.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the camera-space clipping core with the segment test and the crop conversion with the projection, keeping only the two edge sweeps and the slab test that belong to a box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither body is sampled at chosen points and no tolerance widens either; both halves of the criterion always run until one finds a crossing.

## @evidence contracts/development/common.md#meaningful-documentation

States why both edge sweeps are needed, with the case each alone misses, that touching counts, the crop error, who judges against it, and each parameter's frame and units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: the eight box corners are transformed into camera space once and the crop converted once for all twelve clips, instead of two rotations and a crop validation per edge, then at most twelve slab tests over the eight frustum corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate over one box and one camera that coordinates no work across calls; the grader calls it once per sampled instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Creates bounded constant-size original, camera-local and frustum corner arrays plus vector arithmetic temporaries, and retains none after return.
