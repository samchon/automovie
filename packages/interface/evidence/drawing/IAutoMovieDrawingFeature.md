# src/drawing/IAutoMovieDrawingFeature.ts#IAutoMovieDrawingFeature

## @evidence contracts/development/design.md#principled-representation `resolveAutoMovieDrawingFeature` places the element by its world matrix, filters the model's parts when `part` is set, builds the addressed family in a canonical order, and refuses a non-integer or out-of-range index or a count that differs from the current family size.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Element, optional part, family, index and optional count form a coordinate-free positional address. The count detects size changes in the addressed family, not arbitrary replacements; stable feature identity or geometry-version tracking is not stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A changed feature count makes the target stale instead of relocating it onto whichever feature inherited the index, and an unresolvable target never snaps to the nearest surviving feature.

## @evidence contracts/development/common.md#meaningful-documentation

States what places the feature, when `part` is ignored, which families renumber under reordering and which do not, the legal index for `axis` and `centroid`, and what the authored count protects against.
