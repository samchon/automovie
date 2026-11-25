# src/pose/IAutoMovieHumanoidSurfaceRays.ts#IAutoMovieHumanoidSurfaceRays.ISurfacePoint

## @evidence contracts/development/common.md#meaningful-documentation

States what the point and the normal are and in which frame.

## @evidence contracts/development/design.md#principled-representation

A surface sample: a world point and the collider's outward unit normal at it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two members a region frame is built from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None; the normal is the exited collider's own, not the ray's direction.
