/**
 * Explicit visual source class for one occurrence in the current compiled film timeline.
 *
 * @evidence contracts/common.md#principled-implementation Lane planning joins each declaration by exact ordered occurrence and shot identity, requiring one deterministic or selected-repaint source for every delivered timeline position.
 * @evidence contracts/common.md#clear-and-simple-design This authored decision contains only occurrence, shot and source class; resolved file bytes, selection receipts and sequence observations belong to delivery provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated shot uses require distinct occurrence ids, and resident repaint candidates cannot implicitly select a lane; missing, duplicate or misordered populations refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines exact current timeline occurrence, compiled shot identity and the sole selected visual lane.
 * @author Samchon
 */
export interface IAutoMovieProductionVisualDeliveryLane {
  /** Exact occurrence identity derived from its current timeline position. */
  occurrence: string;

  /** Current compiled shot id at that occurrence. */
  shot: string;

  /** Sole selected source class for the occurrence. */
  lane: "deterministic" | "repainted";
}
