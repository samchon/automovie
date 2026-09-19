import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Canonical converted motion result sealed by builder-owned digests.
 *
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Requires the canonical receipt identity to bind the exact output bytes.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Types the motion identity, receipt digest, output path, and output digest relation.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionResult {
  /**
   * Stable project-native motion identity assigned to the result.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Requires meaningful result identity changes to produce a distinct receipt.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Binds canonical receipt serialization to the adopted motion identity.
   */
  motionId: string;

  /**
   * Canonical digest of the project-native motion value.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Requires the adopted motion result digest to remain linked to its source.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Seals the converted motion identity independently of file placement.
   */
  motionDigest: AutoMovieContentDigest;

  /**
   * Production-relative builder-owned result file path.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Requires path notation to be normalized in the canonical result.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Identifies the generated output inventoried by the builder manifest.
   */
  outputPath: string;

  /**
   * Content digest of the exact generated output file bytes.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Requires the receipt to bind the exact output digest.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Couples receipt identity to the generated output inventory digest.
   */
  outputDigest: AutoMovieContentDigest;
}
