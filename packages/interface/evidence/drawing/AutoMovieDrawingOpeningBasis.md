# src/drawing/AutoMovieDrawingOpeningBasis.ts#AutoMovieDrawingOpeningBasis

## @evidence contracts/development/design.md#principled-representation `deriveAutoMovieDrawing` prefers the authored void, falls back to the axis extent of the filling element's world triangles, and otherwise records `none`; the void is preferred because it is the only record that describes the hole rather than the leaf in it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One literal per provenance lets a mark keep a single outline and size shape while a reader still knows which source produced them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A filling element's extent is labelled `fill` and reported as a gap rather than passed off as the opening's size, and a missing source yields an empty mark instead of an invented one.

## @evidence contracts/development/common.md#meaningful-documentation

States what each basis draws and measures, when `none` applies, and which gap each substitute raises.
