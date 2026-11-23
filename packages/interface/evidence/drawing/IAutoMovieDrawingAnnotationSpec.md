# src/drawing/IAutoMovieDrawingAnnotationSpec.ts#IAutoMovieDrawingAnnotationSpec

## @evidence contracts/development/design.md#principled-representation

The note stores a feature address rather than a page anchor, so each derivation resolves its position from current static CPU geometry. Text is copied verbatim and never parsed or recomputed as a measurement; a resolved anchor does not verify the note's statement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, identity, text and target, are all a note needs; style comes from the view's pen and position from the target, so neither is stored here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No page position is stored to fall back on; a repeated id within a view's notes is refused by the derivation rather than resolved twice.

## @evidence contracts/development/common.md#meaningful-documentation

States that the target is re-resolved on every derivation, that id and text are copied verbatim, and that a repeated id is refused.
