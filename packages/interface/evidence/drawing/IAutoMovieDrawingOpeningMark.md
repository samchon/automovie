# src/drawing/IAutoMovieDrawingOpeningMark.ts#IAutoMovieDrawingOpeningMark

## @evidence contracts/development/design.md#principled-representation

Marks prefer the profile's conservative hull extent in face axes, otherwise using the fill's static CPU triangle extents with world Y height and max(X,Z) width; an absent held model or empty triangles yields none. Profile points are projected and rounded without cut/depth clipping or a postprojection polygon-validity check, so an edge-on outline can collapse while retaining profile basis and face-space dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Identity fields mirror the design's opening record, and one `basis` field decides how `polygon`, `width` and `height` are read, so a consumer branches once instead of inferring provenance from which fields are empty.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fill-sized opening gets no outline instead of the leaf's box drawn as a void, and an unsized opening gets `null` sizes instead of zero; the drawing also files `opening-profile` and `opening-geometry` gaps that count those marks.

## @evidence contracts/development/common.md#meaningful-documentation

States which openings receive a mark, their order, and what each basis means; members give the metre unit, the face axes or world axes behind each size, the chord drafting of arcs, and when the outline is empty.
