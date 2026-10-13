/**
 * One step of the construction plan.
 *
 * Prerequisites make this a directed acyclic graph rather than a numbered list:
 * two wings can be stripped independently and still both precede a shared
 * structural phase. A cycle is refused rather than broken at an arbitrary edge,
 * because there is no correct place to break one.
 *
 * Where a schedule needs one order, `designLineagePhaseOrder` takes ready
 * phases in ascending code-unit id order, so reordering the source array never
 * reorders the schedule.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignPhase {
  /** Stable phase identity within the lineage. */
  id: string;

  /** Human label such as `demolition`, `structure`, `services`, `finishes`. */
  label: string;

  /** Phase ids that must complete before this one; empty for a first phase. */
  requires: string[];
}
