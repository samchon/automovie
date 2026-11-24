# src/scene/inspection/measureAutoMovieCameraFrameEdge.ts#measureAutoMovieCameraFrameEdge

## @evidence contracts/development/common.md#meaningful-documentation

States the crossing test and its slack, the unit and frame of an extent, why an extent is read only beyond the near plane, and every outcome.

## @evidence contracts/development/implementation.md#principled-implementation

Uses Three's normalized frustum planes from the actual delivery projection, so crop and aspect are included. A side is crossed when the box corner furthest outside its plane lies beyond 32 ulps of the plane arithmetic, the test the framing grade applies. Perspective division maps the convex box beyond the near plane to a convex region, so its normalized device extremes lie at the vertices of the box clipped by that plane. A side crossed only before the near plane cannot be cut, because the GPU draws nothing there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the projection and bounds, list crossed sides, measure their extents, then let measureAutoMovieCameraFrameEdgeSurface judge the drawn surface only when some side has an extent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A box crossing alone never stands for a confirmed cut; an unreadable surface is reported unmeasured, and missing bounds or a non-finite projection are reported apart from a clear frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

The side test checks four support points; extents read at most twenty clipped box vertices. Triangle work runs only for a crossing with an extent, under the caller's budget.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Bounds come from boundAutoMovieCameraSubject, which reads Three's cached geometry box and the skin's pose cache, or from the certified envelope the framing grade also uses.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates per-call matrices and vectors and returns plain values.
