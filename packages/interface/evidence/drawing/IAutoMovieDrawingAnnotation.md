# src/drawing/IAutoMovieDrawingAnnotation.ts#IAutoMovieDrawingAnnotation

## @evidence contracts/development/design.md#principled-representation `deriveAutoMovieDrawing` resolves the spec's target with `resolveAutoMovieDrawingFeature`, projects a resolved world point onto the frame and rounds it to six decimals, and copies a stale resolution's reason verbatim.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The resolved note mirrors its spec's id and text and adds only the outcome, so a reader reconciles sheet and view by id without consulting the view.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A stale note keeps its text but loses its position instead of staying at the last known point, and the text extent is declared as a gap rather than estimated.

## @evidence contracts/development/common.md#meaningful-documentation

States when each member is null, the page units of the anchor, that the text extent is not measured, and where the reason comes from.
