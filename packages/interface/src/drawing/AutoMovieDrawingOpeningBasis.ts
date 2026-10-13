/**
 * Where an opening mark's geometry came from.
 *
 * `profile` is the opening's own void placed on its host boundary's face.
 * `fill` is the filling element's bounding extent standing in for a void nobody
 * authored. `none` means neither exists, and the mark carries no outline and no
 * size. A drawing reports its `fill` and `none` marks as the `opening-profile`
 * and `opening-geometry` gaps.
 *
 * @author Samchon
 */
export type AutoMovieDrawingOpeningBasis = "profile" | "fill" | "none";
