/**
 * Explicit visual source class for one occurrence in the current compiled film timeline.
 *
 * @evidence contracts/development/design.md#principled-representation Occurrence and shot strings accompany a closed deterministic-or-repainted choice, representing an authored timeline selection without performing occurrence joins or resolving source bytes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This authored decision contains only occurrence, shot and source class; resolved file bytes, selection receipts and sequence observations belong to delivery provenance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lane must be explicit in typed declarations, but string identities do not enforce uniqueness or order; no maintained runtime consumer admits this retained design field against the compiled timeline.
 * @evidence contracts/development/common.md#meaningful-documentation Defines exact current timeline occurrence, compiled shot identity and the sole selected visual lane.
 */
export interface IAutoMovieProductionVisualDeliveryLane {
  /** Exact occurrence identity derived from its current timeline position. */
  occurrence: string;

  /** Current compiled shot id at that occurrence. */
  shot: string;

  /** Sole selected source class for the occurrence. */
  lane: "deterministic" | "repainted";
}
