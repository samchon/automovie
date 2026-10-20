/**
 * Where an opening mark's geometry came from.
 *
 * `profile` is the opening's own void placed on its host boundary's face, with
 * an outline and a size. `fill` is the filling element's bounding extent
 * standing in for a void nobody authored, with a size but no outline. `none`
 * means there is neither a void nor a filling element with environment-owned
 * geometry, and the mark carries no outline and no size. A drawing reports its
 * `fill` and `none` marks as the `opening-profile` and `opening-geometry` gaps.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawing` prefers the authored void, falls back to the axis extent of the filling element's world triangles, and otherwise records `none`; the void is preferred because it is the only record that describes the hole rather than the leaf in it.
 * @evidence contracts/common.md#clear-and-simple-design One literal per provenance lets a mark keep a single outline and size shape while a reader still knows which source produced them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A filling element's extent is labelled `fill` and reported as a gap rather than passed off as the opening's size, and a missing source yields an empty mark instead of an invented one.
 * @evidence contracts/common.md#meaningful-documentation States what each basis draws and measures, when `none` applies, and which gap each substitute raises.
 */
export type AutoMovieDrawingOpeningBasis = "profile" | "fill" | "none";
