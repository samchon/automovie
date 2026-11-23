/**
 * Explicit visual source class for one occurrence in the current compiled film
 * timeline.
 */
export interface IAutoMovieProductionVisualDeliveryLane {
  /** Exact occurrence identity derived from its current timeline position. */
  occurrence: string;

  /** Current compiled shot id at that occurrence. */
  shot: string;

  /** Sole selected source class for the occurrence. */
  lane: "deterministic" | "repainted";
}
