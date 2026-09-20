/**
 * Independent truth value for one aggregate temporal review axis.
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-temporal-artifacts Preserves failed, unperformed, and unsupported truth.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-structure-continuity Reserves publication for current passing verdicts.
 */
export type AutoMovieRepaintObservationVerdict =
  | "pass"
  | "fail"
  | "not-run"
  | "unsupported";
