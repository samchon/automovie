# src/drawing/AutoMovieDrawingProjection.ts#AutoMovieDrawingProjection

## @evidence contracts/development/design.md#principled-representation

Every projection shares `autoMovieDrawingFrame` and the signed-distance classification; `autoMovieDrawingHasCut` turns the cut off only for `elevation`, and only `reflected-ceiling-plan` negates the page right axis, which is the whole of the mirror.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four literals select two booleans inside one derivation instead of four drafting algorithms, so every view uses the same clipping, silhouette and rounding code.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Direction and plane come only from the view's vectors; the literal never adjusts them, and an inconsistent pairing such as a `plan` looking sideways is drawn as stated rather than corrected.

## @evidence contracts/development/common.md#meaningful-documentation

States what each literal removes, cuts and mirrors, how `overhead` and `depth` apply, and that the literal is not checked against the direction.
