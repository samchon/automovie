/**
 * Explicit active-scene omission from one phase-local coverage denominator.
 *
 * @evidence contracts/common.md#principled-implementation screenplaySceneIncludedAtPhase excludes an active scene only at its declared screenplay, production or edit phase, while an OMITTED tombstone belongs to no phase denominator.
 * @evidence contracts/common.md#clear-and-simple-design A phase and auditable reason express local exemption without conflating it with permanent scene deletion or a general opt-out from downstream work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disposition cannot coexist with a tombstone or claimed realization in its exempted phase; blank reasons refuse and another phase still owes its own coverage.
 * @evidence contracts/common.md#meaningful-documentation Defines the phase vocabulary and required reason for a local omission from realized coverage.
 * @author Samchon
 */
export interface IAutoMovieSceneDisposition {
  /** Workflow phase whose output intentionally omits the scene. */
  phase: "screenplay" | "production" | "edit";

  /**
   * Auditable reason the scene does not require a realized shot in this phase.
   */
  reason: string;
}
