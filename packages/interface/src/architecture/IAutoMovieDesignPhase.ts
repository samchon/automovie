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
 * @evidence contracts/common.md#principled-implementation Phases form a directed acyclic graph through `requires`; validation refuses unresolved, duplicated, and cyclic prerequisites, and the deterministic order is a topological sort that breaks ties by ascending code-unit id.
 * @evidence contracts/common.md#clear-and-simple-design An id, a label, and a prerequisite list with no sequence number, because independent branches have no order between them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cycle is refused rather than broken at a chosen edge, and the label is free text checked only for being non-blank; no phase name such as `demolition` is interpreted.
 * @evidence contracts/common.md#meaningful-documentation States the identity scope, the label vocabulary, that empty `requires` marks a first phase, and how a single order is derived.
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
