# src/drawing/IAutoMovieDrawingRegion.ts#IAutoMovieDrawingRegion

## @evidence contracts/development/design.md#principled-representation

Cell half-spaces map to page inequalities and clip an initial square of half-extent 10000 m; reaching its edge within 1e-9 means bounded false, so a large bounded section can be reported unbounded. Coefficients at or below 1e-9 use the parallel-plane branch without normal normalization. The drafter rounds surviving vertices and unsigned shoelace area to six decimals; binary64 clipping and grid collapse do not certify exact topology or area.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One region per cell avoids a polygon union and retains space/cell/kind identity. Overlapping cells can yield overlapping regions; the finish is the one distinct non-null material collected from realizing boundary elements' held model parts, rather than agreement proved for every boundary or a construction assembly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unbounded cell is reported as `unbounded-space-cell` instead of drawing the clipping square as a room, a shelled space is reported as `shelled-space-section` instead of being approximated, and a finish that the realizing elements disagree on is `null` instead of the first material found.

## @evidence contracts/development/common.md#meaningful-documentation

States what a region is and is not, when regions exist and which spaces produce none, and the sort order; members give the polygon's convexity, winding and minimum size, the area unit and rounding, and how `finish` is resolved and when it is `null`.
