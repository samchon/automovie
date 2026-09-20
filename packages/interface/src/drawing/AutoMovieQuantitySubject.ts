/**
 * What a quantity report answers for.
 *
 * A closed list, and every one of them appears in every report. A take-off that
 * printed only the subjects it happened to find something for would read as a
 * building with no openings whenever somebody forgot to author one, so a
 * subject with nothing to measure reports a zero total over zero owners and
 * says so out loud.
 *
 * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `AutoMovieQuantitySubject` as the portable data boundary for the building exterior schedules quantities requirement.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `AutoMovieQuantitySubject` for the building envelope deliverable quantity invariant system contract.
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
