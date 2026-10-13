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
 * @evidence contracts/common.md#principled-implementation Each subject is closed-form arithmetic over authored geometry: shoelace footprint area minus holes, shell or convex-cell volume, closed-form arc void area, polyline length, and occurrence counts keyed by kind or model.
 * @evidence contracts/common.md#clear-and-simple-design A closed union whose order `AUTOMOVIE_QUANTITY_SUBJECTS` lists once and whose units one table maps, so adding a subject is one literal and one unit entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every subject is reported even with zero owners, because the tally map is seeded from the full list rather than from what the walk happened to find.
 * @evidence contracts/common.md#meaningful-documentation Gives each subject's unit, measured quantity and owner key, and the always-reported rule.
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
