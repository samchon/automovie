# src/human/generation/IAutoMovieHumanBodyApertures.ts#IAutoMovieHumanBodyApertures.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

An aperture with its margin and projected cut outline evaluated once.

## @evidence contracts/development/design.md#principled-representation `aperture`: Aperture data. `outline`: Projected outline of the cut: the margin itself, or for an eye the outer edge of the lid band around it. `lid`: Lid of an eye opening: the calibrated eye nearest the margin's centre lies behind it; null for any other opening.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyApertures.prepare. Read by AutoMovieHumanApertureSpan.of, AutoMovieHumanBodyApertures.refine, AutoMovieHumanBodySurfaceOpening.open. Also types AutoMovieHumanBodySurface.spans.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `aperture`, `outline`, `lid`, `edge`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyApertures.ts#IAutoMovieHumanBodyApertures.DetailBoxes

## @evidence contracts/development/common.md#meaningful-documentation

Stations refined wherever a chain's rings pass through a detail box, at the same SPACING as around openings: a colour boundary drawn per vertex, such as the lips', is otherwise sampled on triangles several millimetres tall and shows as steps.

## @evidence contracts/development/design.md#principled-representation

Stations refined wherever a chain's rings pass through a detail box, at the same SPACING as around openings: a colour boundary drawn per vertex, such as the lips', is otherwise sampled on triangles several millimetres tall and shows as steps. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyApertures.DetailBoxes is the canonical exchange used by AutoMovieHumanBodyApertures.detail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyApertures.detail for stations refined wherever a chain's rings pass through a detail box, at the same SPACING as around openings: a colour boundary drawn per vertex, such as the lips', is otherwise sampled on triangles several millimetres tall and shows as steps.
