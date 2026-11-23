# src/geometry/IAutoMovieSubdivisionRing.ts#IAutoMovieSubdivisionRing

## @evidence contracts/development/design.md#principled-representation

After one refinement every face is a quad, so a vertex's neighbourhood is its centre, edge neighbours and diagonals, the support of the published limit and tangent masks and of one more refinement of the ring itself.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Packed coordinates in fan order with the edge sharpness, the least a ring step and the limit masks need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Boundary edges stay at sharpness 10 so the ring step and limit treat them by the same sharp rules.

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the meaning of diagonal `i`, the interior and boundary shapes and why these points suffice.
