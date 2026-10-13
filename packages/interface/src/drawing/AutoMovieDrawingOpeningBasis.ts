/**
 * Where an opening mark's geometry came from.
 *
 * `profile` is the opening's own void placed on its host boundary's face.
 * `fill` is the filling element's bounding extent standing in for a void nobody
 * authored. `none` means neither exists, and the mark carries no outline and no
 * size. A drawing reports its `fill` and `none` marks as the `opening-profile`
 * and `opening-geometry` gaps.
 *
 * @evidence contracts/common.md#principled-implementation Encodes the preference order `openingMark` applies, an authored profile first, a filling element with geometry second, nothing third, so every mark states the provenance of its size.
 * @evidence contracts/common.md#clear-and-simple-design Three literals cover every outcome of that order, and the schedule groups openings by the same basis instead of inventing its own label.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fallback extent is labelled `fill` rather than passed off as the void, and `none` produces no zero-sized shape; both cases also raise drawing gaps.
 * @evidence contracts/common.md#meaningful-documentation Defines each literal, what geometry the mark carries for it, and which gap subjects report the two fallback cases.
 * @author Samchon
 */
export type AutoMovieDrawingOpeningBasis = "profile" | "fill" | "none";
