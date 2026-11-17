/**
 * One causal change of a segment's native motion authority.
 *
 * seconds is local film time including native substeps; kind separates dynamic, C1 kinematic return and authored authority. advancePhysicalOwnership emits events consumed by cache and playback ownershipAt using the latest matching event at or before the query. A return event is a kinematic reconciliation, not force response. Callers preserve producer order and initial events; missing matching history causes sampling to throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation One causal change of a segment's native motion authority.
 * @evidence contracts/development/design.md#principled-representation seconds is local film time including native substeps; kind separates dynamic, C1 kinematic return and authored authority.
 * @evidence contracts/development/design.md#minimal-and-owned-surface advancePhysicalOwnership emits events consumed by cache and playback ownershipAt using the latest matching event at or before the query.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A return event is a kinematic reconciliation, not force response. Callers preserve producer order and initial events; missing matching history causes sampling to throw.
 */
export interface IAutoMoviePhysicalOwnershipEvent {
  /** Provider identity. */
  body: string;

  /** Segment identity. */
  bone: string;

  /** Local seconds, including native substeps. */
  seconds: number;

  /** Return is a C1 kinematic reconciliation, not a dynamic force response. */
  kind: "dynamic" | "return" | "authored";
}
