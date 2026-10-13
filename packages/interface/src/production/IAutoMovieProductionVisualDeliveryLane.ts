/** Explicit delivery lane for one occurrence in the compiled film timeline. */
export interface IAutoMovieProductionVisualDeliveryLane {
  /** Exact occurrence identity derived from its current timeline position. */
  occurrence: string;

  /** Current compiled shot id at that occurrence. */
  shot: string;

  /** Sole selected source class for the occurrence. */
  lane: "deterministic" | "repainted";
}
