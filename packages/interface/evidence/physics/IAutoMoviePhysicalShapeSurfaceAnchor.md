# src/physics/IAutoMoviePhysicalShapeSurfaceAnchor.ts#IAutoMoviePhysicalShapeSurfaceAnchor.IResult

## @evidence contracts/development/common.md#meaningful-documentation

World-space support feature of a collider in a requested bone-local direction.

## @evidence contracts/development/design.md#principled-representation

point is world metres; normal is the normalized requested direction rotated into world space, rather than necessarily a smooth-face normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalShapeSurfaceAnchor allocates both vectors after applying the shape and bone transforms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Callers supply an admitted shape, pose and nonzero direction. Tied box coordinates use a face centre, capsule ties a segment midpoint and hull ties a mean of extreme vertices.
