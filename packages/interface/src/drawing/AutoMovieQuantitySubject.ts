/**
 * What a quantity report answers for.
 *
 * Every subject appears in every report. No attributed measurement yields zero
 * over zero owners, while authored zero or rounded-to-zero contributions can
 * yield zero with owners present. Unmeasured records can also be counted in
 * gaps; a zero finding alone does not prove absence or complete authorship.
 *
 * - `space-floor-area` (`m2`): plan area of each support surface, holes
 *   subtracted, summed per space.
 * - `space-volume` (`m3`): shell volume, or the sum of bounded cell volumes, per
 *   space.
 * - `opening-area` (`m2`): area of each authored void profile, per opening.
 * - `connector-length` (`m`): polyline length of each route, per connector.
 * - `element-count`, `opening-count` (`count`): elements per element kind and
 *   openings per opening kind.
 * - `model-occurrence-count` (`count`): elements per cited model id.
 */
export type AutoMovieQuantitySubject =
  | "space-floor-area"
  | "space-volume"
  | "opening-area"
  | "connector-length"
  | "element-count"
  | "opening-count"
  | "model-occurrence-count";
