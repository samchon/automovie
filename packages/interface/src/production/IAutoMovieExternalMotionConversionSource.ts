import type { IAutoMovieExternalMotionBasis } from "./IAutoMovieExternalMotionBasis";
import type { IAutoMovieExternalMotionTake } from "./IAutoMovieExternalMotionTake";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieExternalMotionReceiptResource } from "./IAutoMovieExternalMotionReceiptResource";

/**
 * Complete byte-grounded source basis consumed by one motion conversion.
 *
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Binds source closure, selection, basis, and interpretation to the result.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Types the pinned and normalized motion input basis.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionSource {
  /**
   * Primary external motion asset and its exact content digest.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Requires the raw source identity in the receipt.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Pins the primary source bytes as a deterministic conversion input.
   */
  asset: IAutoMovieExternalMotionReceiptResource;
  /**
   * Ordered dependency files required to interpret the source asset.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Requires dependency digests beside the raw source.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Preserves the canonicalized source closure used by conversion.
   */
  closure: IAutoMovieExternalMotionReceiptResource[];
  /**
   * Exact animation take selected from the source bytes.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Requires the selected take to remain in the non-destructive receipt.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Binds conversion to the inspected source take and its range.
   */
  take: IAutoMovieExternalMotionTake;
  /**
   * Canonical coordinate, hierarchy, and local-rest basis inspected from bytes.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Requires the source skeleton, unit, axes, and rest basis before adoption.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Seals the byte-grounded basis into the conversion source.
   */
  basis: IAutoMovieExternalMotionBasis;
  /**
   * Canonical digest of the inspected source basis.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Binds the declared coordinate and unit interpretation to the result.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Makes basis equality part of deterministic receipt identity.
   */
  basisDigest: AutoMovieContentDigest;
}
