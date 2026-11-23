# src/geometry/IAutoMovieRefineSubdivisionUvs.ts#IAutoMovieRefineSubdivisionUvs.IResult

## @evidence contracts/development/design.md#principled-representation

UVs keep the source chart's units and are not clamped to [0,1]; cornerUvs indexes values in child-quad corner order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

refineSubdivisionLevel consumes both arrays and passes the same parent-vertex masks used for positions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Cage admission establishes UV indices and ownership; numeric equality does not join charts, because continuity compares UV identities at both ends of an edge.

## @evidence contracts/development/common.md#meaningful-documentation

Refined indexed face-varying UV values with pinned chart boundaries. UVs keep the source chart's units and are not clamped to [0,1]; cornerUvs indexes values in child-quad corner order.
