# src/scene/inspection/measureAutoMovieCameraFrameEdgeSurface.ts#measureAutoMovieCameraFrameEdgeSurface

## @evidence contracts/development/common.md#meaningful-documentation

States the near-plane clip, the cut test and its slack, how the visible fraction is measured and in which units, that both faces count, that the far plane is not applied, and every outcome.

## @evidence contracts/development/implementation.md#principled-implementation

The GPU draws nothing on the camera side of the near plane, so each triangle is clipped to it first. Signed distance to a side plane is linear over the clipped convex polygon, so a vertex outside the plane beyond 32 ulps of its arithmetic plus an owned skin's stated float32 tolerance confirms a cut. A planar polygon beyond the near plane projects to the polygon of its projected vertices, so its shoelace area is exact; the ratio of in-frame to whole area is independent of the axis scales of normalized device space. A surface with projected area and none of it in frame draws nothing in the picture, so it is `outside` rather than a cut with a visible fraction of zero. Opacity follows the near-clip check's stock-surface rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit meshes reaching beyond the near plane and count their drawn triangles against the budget, then clip, test and sum areas per triangle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An exceeded budget is reported apart from an uncheckable surface, and neither is reported clear; a non-finite vertex stops the check as unmeasured.

## @evidence contracts/development/implementation.md#efficient-algorithms

A mesh wholly before the near plane costs O(1); the rest cost O(T) for T drawn triangles, at most the budget, with constant work per triangle on fixed scratch vectors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the geometry box Three caches, the skin's pose cache and the drawn ranges readAutoMovieDrawnRanges shares with the near-clip check.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Uses fixed scratch arrays per call and returns plain values only.
