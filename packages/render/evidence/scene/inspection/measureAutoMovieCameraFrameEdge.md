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

# src/scene/inspection/measureAutoMovieCameraFrameEdge.ts#measureAutoMovieCameraFrameEdge.Side

## @evidence contracts/development/common.md#meaningful-documentation

Names the four sides of the delivered frame.

## @evidence contracts/development/design.md#principled-representation

A closed union of the four frustum side planes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by ICrossing and the frame-edge finding's measurements.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Side names are fixed literals, never free text.

# src/scene/inspection/measureAutoMovieCameraFrameEdge.ts#measureAutoMovieCameraFrameEdge.ICrossing

## @evidence contracts/development/common.md#meaningful-documentation

States the side, the extent's unit and when the extent is absent.

## @evidence contracts/development/design.md#principled-representation

A crossed side and an optional extent keep a crossing before the near plane apart from one that reaches the drawn picture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, produced by measureAutoMovieCameraFrameEdge and read by the placed camera observer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unmeasurable extent is omitted, never written as zero.

# src/scene/inspection/measureAutoMovieCameraFrameEdge.ts#measureAutoMovieCameraFrameEdge.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Names each state and the evidence it carries.

## @evidence contracts/development/design.md#principled-representation

Bounds inside the frame, bounds crossing it with a surface outcome, and unreadable bounds are distinct observations with distinct states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result carries crossings and the surface outcome only; findings and coverage stay with the caller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unmeasured state never reports inside.
