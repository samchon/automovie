# src/geometry/IAutoMovieRefineSubdivisionPoints.ts#IAutoMovieRefineSubdivisionPoints.IResult

## @evidence contracts/development/design.md#principled-representation

Packed xyz positions retain local metres; output order is parent vertices, parent edges, then parent faces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

refineSubdivisionLevel uses these positions for child topology and reuses the masks in refineSubdivisionUvs; limitSubdivisionLevel also reads the points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This numerical step relies on admitted topology and aligned finite position arrays; it does not perform cage admission or repair.

## @evidence contracts/development/common.md#meaningful-documentation

New Catmull-Clark points and the parent-vertex masks used to compute them. Packed xyz positions retain local metres; output order is parent vertices, parent edges, then parent faces.
