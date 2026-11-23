# src/drawing/IAutoMovieDrawingCellSection.ts#IAutoMovieDrawingCellSection

## @evidence contracts/development/design.md#principled-representation

IResult pairs unrounded page-metre corners with finite-window containment; the boolean does not establish global boundedness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

sectionAutoMovieDrawingSpaces needs both polygon and bounded status to emit regions or explain omissions, reusing canonical drawing points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty, degenerate and window-limited sections retain their actual outputs instead of acquiring guessed room dimensions.

## @evidence contracts/development/common.md#meaningful-documentation

IResult states the 10 km window, empty case, corner orientation and validation premises.

# src/drawing/IAutoMovieDrawingCellSection.ts#IAutoMovieDrawingCellSection.IResult

## @evidence contracts/development/design.md#principled-representation

Polygon coordinates are unrounded page metres in clipping order, counter-clockwise for nondegenerate sections. bounded reports strict containment in the finite working square, including true for an empty intersection, not a closed-volume certificate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The section consumer needs the polygon for area/region creation and bounded to report omitted sections; it reuses canonical drawing points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty, degenerate and working-boundary-limited results remain distinguishable without inventing a room outline; floating-point clipping and its fixed epsilon remain numerical limits.

## @evidence contracts/development/common.md#meaningful-documentation

Defines units, orientation, empty and degenerate results, finite-window limitation, ownership and admission responsibility.
