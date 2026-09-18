import { IAutoMovieExternalMotionBasis } from "./IAutoMovieExternalMotionBasis";
import { IAutoMovieExternalMotionTake } from "./IAutoMovieExternalMotionTake";

/**
 * Byte-grounded motion facts recorded for an external animation asset.
 *
 * This is an inventory, not a take or retarget decision. Those choices remain
 * in {@link IAutoMovieExternalMotionAdoption}.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Makes external motion bytes declarable and digest-bound.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Records the deterministic ingest identity and inspected take set.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Exposes `IAutoMovieExternalMotionProvenance` as the portable data boundary for the motion external adoption receipt requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `IAutoMovieExternalMotionProvenance` for the performance motion external adoption receipt system contract.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionProvenance {
  /**
   * Versioned ingest normalization profile selected for these bytes.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Declares how the motion container was inspected.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Binds inspected facts to one deterministic conversion profile.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Exposes `ingestProfile` as the portable data boundary for the motion external adoption receipt requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `ingestProfile` for the performance motion external adoption receipt system contract.
   */
  ingestProfile: "gltf-motion-v1";
  /**
   * Canonical hierarchy and rest basis inspected from the resident source
   * bytes.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Grounds channel interpretation in observed node hierarchy, units, axes, and rest transforms.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Retains the normalized byte basis beside source takes and digests.
   */
  basis: IAutoMovieExternalMotionBasis;
  /**
   * Inspected animation takes in source index order.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Makes all eligible source members visible before user selection.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Retains the canonical inspected result set.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Exposes `takes` as the portable data boundary for the motion external adoption receipt requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `takes` for the performance motion external adoption receipt system contract.
   */
  takes: IAutoMovieExternalMotionTake[];
}
