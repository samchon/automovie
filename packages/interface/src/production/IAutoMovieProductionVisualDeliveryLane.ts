/**
 * Explicit delivery lane for one occurrence in the compiled film timeline.
 *
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Requires every delivered occurrence to name exactly one deterministic or repainted lane.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Carries occurrence identity without inferring a lane from resident artifacts.
 */
export interface IAutoMovieProductionVisualDeliveryLane {
  /** Exact occurrence identity derived from its current timeline position. */
  occurrence: string;
  /** Current compiled shot id at that occurrence. */
  shot: string;
  /** Sole selected source class for the occurrence. */
  lane: "deterministic" | "repainted";
}
