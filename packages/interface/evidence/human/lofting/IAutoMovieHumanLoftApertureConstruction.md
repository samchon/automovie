# src/human/lofting/IAutoMovieHumanLoftApertureConstruction.ts#IAutoMovieHumanLoftApertureConstruction

## @evidence contracts/development/common.md#meaningful-documentation

Describes projected aperture margins, depth windows and segment-addressed spatial grids; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Projected aperture margins, depth windows and segment-addressed spatial grids. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanLoftAperture; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing LoftApertureConstruction contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/lofting/IAutoMovieHumanLoftApertureConstruction.ts#IAutoMovieHumanLoftApertureConstruction.IOutline

## @evidence contracts/development/common.md#meaningful-documentation

The margin seen along the aperture's `forward` axis.

## @evidence contracts/development/design.md#principled-representation `forward`: Unit direction the opening faces. `lateral`: Unit lateral axis of the projection plane. `up`: Unit second axis of the projection plane, `lateral x forward`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLoftAperture.outline. Read by AutoMovieHumanBodyRoots.trim, AutoMovieHumanLoftAperture.signed, AutoMovieHumanLoftAperture.snap.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `forward`, `lateral`, `up`, `points`, `window`, `box`, `grid`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanLoftApertureConstruction.ts#IAutoMovieHumanLoftApertureConstruction.IGrid

## @evidence contracts/development/common.md#meaningful-documentation

A square grid of cells over an outline's bounding box, each cell listing the segments whose bounding box overlaps it, and each row of cells (a band) listing the segments whose height range overlaps it.

## @evidence contracts/development/design.md#principled-representation `origin`: Lower corner `[lateral, up]` of the first cell, mm. `size`: Side of a cell, mm. `columns`: Cells across.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLoftAperture.gridOf. Also types AutoMovieHumanLoftAperture.g.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `origin`, `size`, `columns`, `rows`, `cells`, `bands`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanLoftApertureConstruction.ts#IAutoMovieHumanLoftApertureConstruction.RangeResult

## @evidence contracts/development/common.md#meaningful-documentation

Lowest and highest world heights of the aperture margin, in millimetres, in that order.

## @evidence contracts/development/design.md#principled-representation

Lowest and highest world heights of the aperture margin, in millimetres, in that order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLoftApertureConstruction.RangeResult is the canonical exchange used by AutoMovieHumanLoftAperture.range.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanLoftAperture input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
