
/**
 * The lane-independent identity of one exact delivered film occurrence.
 *
 * @evidence contracts/common.md#principled-implementation Occurrence identity and shot distinguish repeated uses of the same shot, while a render-relative immutable source path and byte digest identify the exact visual input consumed at that timeline position.
 * @evidence contracts/common.md#clear-and-simple-design Shared occurrence and file identity compose with either deterministic or repainted lane metadata, avoiding duplication of timeline membership across both arms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Separate occurrence and shot fields can distinguish repeated shots, but strings do not enforce unique membership, safe relative paths or byte equality; those intended invariants have no maintained delivery runtime consumer here.
 * @evidence contracts/common.md#meaningful-documentation Defines stable occurrence identity, compiled shot reference, render-root-relative source path and exact visual byte digest.
 * @author Samchon
 */
export interface IAutoMovieProductionRenditionDeliveryOccurrence {
  /** Stable timeline occurrence identity. */
  occurrence: string;

  /** Exact compiled shot id. */
  shot: string;

  /** Render-root-relative immutable visual source. */
  path: string;

  /** Exact current visual source digest. */
  digest: string;
}
