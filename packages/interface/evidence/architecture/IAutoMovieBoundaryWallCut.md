# src/architecture/IAutoMovieBoundaryWallCut.ts#IAutoMovieBoundaryWallCut

## @evidence contracts/development/design.md#principled-representation

Bounds the face outline in its planar frame and rotates its box midpoint into world space. Void rectangles bound the shared straight arc-envelope ring; this is a rectangular proxy under `outlineHull`'s geometric/numerical premises, rather than a convex-hull or exact curved cut.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries the panel size, its world placement and its voids in the units `buildAutoMovieWall` consumes, with every void keyed by its opening id, so the mesh step needs no second lookup into the environment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Arched or concave shapes are not approximated by fitted rectangles or segmented voids; they are handed over as their bounds, a stated kernel limit, and overlapping void bounds are left to the kernel's named refusal.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, that the panel bounds the outline and is centred on the face plane, how each void is bounded and measured from the panel's lower-left corner, that profile-less openings have no void, the metre units, and that `rotation` is the face's own object.
