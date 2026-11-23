/**
 * Where an opening mark's geometry came from.
 *
 * `profile` is the opening's own void placed on its host boundary's face, with
 * an outline and a size. `fill` is the filling element's bounding extent
 * standing in for a void nobody authored, with a size but no outline. `none`
 * means there is neither a void nor a filling element with environment-owned
 * geometry, and the mark carries no outline and no size. A drawing reports its
 * `fill` and `none` marks as the `opening-profile` and `opening-geometry`
 * gaps.
 */
export type AutoMovieDrawingOpeningBasis = "profile" | "fill" | "none";
