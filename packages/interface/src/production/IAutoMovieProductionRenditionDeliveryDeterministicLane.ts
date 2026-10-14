
/**
 * The deterministic renderer lane of one delivered occurrence.
 *
 * @evidence contracts/common.md#principled-implementation The deterministic discriminant pairs a declared source digest with null receipt and selection digests, expressing absence of repaint lineage without reading a render plan.
 * @evidence contracts/common.md#clear-and-simple-design This lane arm contributes only deterministic identity to the shared occurrence record, making repaint-only provenance structurally unavailable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null lineage fields exclude repaint receipts structurally; the plain source string neither validates digest syntax nor proves correspondence to a current compile, and no maintained delivery validator consumes this DTO.
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
