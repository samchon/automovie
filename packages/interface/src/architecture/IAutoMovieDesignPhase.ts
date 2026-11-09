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
 * @evidence contracts/development/design.md#principled-representation `validateDesignLineage` resolves each prerequisite, refuses a repeated one, and finds cycles by depth-first search with visiting and visited marks; `designLineagePhaseOrder` is a topological sort that picks the smallest ready id by code units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A phase states only its own direct prerequisites; transitive order, snapshots, and the deterministic schedule are computed from those edges by the engine queries instead of being authored.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cyclic plan is refused instead of broken at an arbitrary edge, and ties between ready phases are settled by id rather than by the order the author happened to write them.
 * @evidence contracts/development/common.md#meaningful-documentation States why the plan is a graph, that cycles are refused and why, how a single schedule order is chosen, and what an empty prerequisite list means.
 */
export interface IAutoMovieDesignPhase {
  /** Stable, non-blank phase identity, unique within the lineage. */
  id: string;

  /**
   * Non-blank human label such as `demolition`, `structure`, `services`, or
   * `finishes`.
   */
  label: string;

  /**
   * Phase ids that must complete before this one, each resolving and listed
   * once; empty for a first phase.
   */
  requires: string[];
}
