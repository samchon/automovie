import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One source or dependency file sealed into an external motion receipt.
 *
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Requires raw source and dependency digests in the receipt input basis.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Types one path-and-digest member of the pinned source closure.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionReceiptResource {
  /**
   * Production-relative path of the pinned source byte file.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Requires each raw source or dependency to remain identifiable.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Normalizes source closure paths before receipt identity is computed.
   */
  path: string;

  /**
   * Content digest of the exact resident bytes.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Pins every source and dependency byte consumed by conversion.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Makes the source closure a digest-grounded deterministic input.
   */
  digest: AutoMovieContentDigest;
}
