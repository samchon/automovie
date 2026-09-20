/**
 * Unit one measured quantity is expressed in.
 *
 * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `AutoMovieQuantityUnit` as the portable data boundary for the building exterior schedules quantities requirement.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `AutoMovieQuantityUnit` for the building envelope deliverable quantity invariant system contract.
 */
export type AutoMovieQuantityUnit = "m" | "m2" | "m3" | "count";
