
/**
 * The deterministic renderer lane of one delivered occurrence.
 *
 * @evidence contracts/common.md#principled-implementation Explicit deterministic selection binds the current deterministic source identity while fixing repaint receipt and selection digests to null; final lane validation compares this with the current plan's deterministic source.
 * @evidence contracts/common.md#clear-and-simple-design This lane arm contributes only deterministic identity to the shared occurrence record, making repaint-only provenance structurally unavailable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resident repaint candidates cannot change the selected lane or populate its null lineage fields; deterministic identity is checked against the current compile and occurrence.
 * @evidence contracts/common.md#meaningful-documentation Defines deterministic source selection and the required absence of repaint receipt and active-selection provenance.
 * @author Samchon
 */
export interface IAutoMovieProductionRenditionDeliveryDeterministicLane {
  /** Deterministic renderer source, unaffected by resident repaint data. */
  lane: "deterministic";

  /** Current deterministic feature source digest. */
  sourceDigest: string;

  /** No repaint lineage belongs to this lane. */
  receiptDigest: null;

  /** No active selection belongs to this lane. */
  selectionDigest: null;
}
