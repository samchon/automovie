/**
 * What a quantity report answers for.
 *
 * A closed list, and every one of them appears in every report. A take-off that
 * printed only the subjects it happened to find something for would read as a
 * building with no openings whenever somebody forgot to author one, so a
 * subject with nothing to measure reports a zero total over zero owners and
 * says so out loud.
 *
 * - `space-floor-area` (`m2`): plan area of each support surface, holes
 *   subtracted, summed per space.
 * - `space-volume` (`m3`): shell volume, or the sum of bounded cell volumes,
 *   per space.
 * - `opening-area` (`m2`): area of each authored void profile, per opening.
 * - `connector-length` (`m`): polyline length of each route, per connector.
 * - `element-count`, `opening-count` (`count`): elements per element kind and
 *   openings per opening kind.
 * - `model-occurrence-count` (`count`): elements per cited model id.
 *
 * @author Samchon
 */
export type AutoMovieQuantitySubject =
  | "space-floor-area"
  | "space-volume"
  | "opening-area"
  | "connector-length"
  | "element-count"
  | "opening-count"
  | "model-occurrence-count";
