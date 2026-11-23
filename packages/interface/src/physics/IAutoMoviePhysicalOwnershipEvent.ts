/**
 * One causal change of a segment's native motion authority.
 *
 * Seconds is local film time including native substeps; kind separates dynamic,
 * C1 kinematic return and authored authority. advancePhysicalOwnership emits
 * events consumed by cache and playback ownershipAt using the latest matching
 * event at or before the query. A return event is a kinematic reconciliation,
 * not force response. Callers preserve producer order and initial events;
 * missing matching history causes sampling to throw.
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

  /**
   * On a return of a jointed segment only: radians the return's
   * post-stabilization moved the solved joint rotation onto the joint's limits
   * (`advancePhysicalOwnership`); zero when the solver left it within them.
   */
  stabilization?: number;
}
