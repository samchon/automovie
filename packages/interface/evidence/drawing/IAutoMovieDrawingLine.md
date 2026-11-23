# src/drawing/IAutoMovieDrawingLine.ts#IAutoMovieDrawingLine

## @evidence contracts/development/design.md#principled-representation `draftAutoMovieDrawingLines` projects each world edge through the view frame, rounds both ends with `roundAutoMovieDrawingPoint`, drops strokes whose rounded ends coincide, orients each stroke from its smaller point, and deduplicates on role, layer, owner and the four coordinates, so equal strokes compare equal only after rounding onto one grid.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A line carries only its owner, space, layer, role and two points; the pen weight and dash come from the view's style by role at serialization, so a line never stores a styling decision.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A face-only boundary takes the first space it separates rather than whichever space the view filter matched, which is a stated rule of the record and not a per-sheet adjustment; no owner kind receives special handling.

## @evidence contracts/development/common.md#meaningful-documentation

States the rounding, endpoint orientation, zero-length and duplicate rules, the sort order, and when the owner is a boundary; each member says what it names and when `space` is `null`.
