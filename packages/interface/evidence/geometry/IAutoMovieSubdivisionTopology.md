# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology

## @evidence contracts/development/design.md#principled-representation

A corner-based half-edge equivalent in flat integer arrays: each manifold edge has exactly two opposite corners, so the counter-clockwise neighbour of a corner is the opposite corner of its in-edge, which is how the fans are ordered for the limit masks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the relations the refinement and limit rules read are stored: face rows, out-edges, edge ends, edge corners, sharpness, and ordered fans; positions and attributes live on the level.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Boundary edges carry sharpness 10 so every rule treats them as infinitely sharp through one code path, which is the published boundary rule rather than a special case.

## @evidence contracts/development/common.md#meaningful-documentation

States the row layout, the out-edge and edge-corner conventions, the fan order and start for interior and boundary vertices, and the edge-count relation of the two fan kinds.
