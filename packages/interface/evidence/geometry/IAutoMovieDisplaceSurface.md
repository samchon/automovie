# src/geometry/IAutoMovieDisplaceSurface.ts#IAutoMovieDisplaceSurface.IProps

## @evidence contracts/development/design.md#principled-representation

Heights are metres in the surface frame, positive outward; crease vertices move along the normalized sum of their distinct limit normals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

displaceAutoMovieSurface borrows the surface and heights and returns new position and normal arrays while sharing topology, UVs and parameters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer checks height count and finiteness and local aggregate normal orientation; the caller supplies an admitted surface and verifies individual faces and global intersections.

## @evidence contracts/development/common.md#meaningful-documentation

Per-vertex normal heights applied to an evaluated subdivision surface. Heights are metres in the surface frame, positive outward; crease vertices move along the normalized sum of their distinct limit normals.
