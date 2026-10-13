/**
 * What a quantity report answers for.
 *
 * A closed list, and every subject appears in every report. A take-off that
 * printed only the subjects it found something for would read as a building
 * with no openings whenever somebody forgot to author one, so a subject with
 * nothing to measure reports a zero total over zero owners.
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
 * @evidence contracts/common.md#principled-implementation `measureAutoMovieQuantities` tallies each subject into a per-owner map from authored records only, with surface footprints, shell or cell volumes, void profiles, route segments and element and opening counts, and emits a finding for every entry of `AUTOMOVIE_QUANTITY_SUBJECTS`.
 * @evidence contracts/common.md#clear-and-simple-design One literal per measured question with its unit and owner granularity fixed by the subject, so a finding needs no per-row unit or grouping field to be read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent quantity is a stated zero rather than a missing row, and what the design cannot support is reported as a gap instead of being estimated.
 * @evidence contracts/common.md#meaningful-documentation States for each subject its unit, what is measured and what owns a contribution, and that every subject is always reported.
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
