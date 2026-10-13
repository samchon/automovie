import type { AutoMovieHumanBodyAcquisitionPosture } from "./AutoMovieHumanBodyAcquisitionPosture";

/**
 * Whole-belly MRI proton-density fat fraction or a desired fraction.
 *
 * Multi-echo Dixon MRI estimates the fat-proton signal fraction within a muscle. This is not subcutaneous adipose volume, muscle force, or a claim that the fat is uniformly distributed. Published thigh MRI repeatability compares this quantity with spectroscopy (Grimm et al. 2018, doi:10.1002/jcsm.12343). Runtime admission enforces a finite fraction in [0, 1].
 *
 * @evidence contracts/common.md#principled-implementation The discriminated MRI PDFF union preserves a dimensionless bounded fraction and supported multi-echo Dixon provenance.
 * @evidence contracts/common.md#clear-and-simple-design Target and observed branches separate desired composition from MRI protocol/posture without owning muscle geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts PDFF is neither an exterior adipose depot nor force, and omitted uncertainty is not fabricated precision.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes signal fraction from spatial uniformity; members give fraction units, method and posture.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fat-fraction typing runs no Dixon reconstruction, spectroscopy correction or muscle segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This PDFF vocabulary retains no completed water-fat separation for cross-request reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The fat-fraction record owns scalar acquisition context without MRI buffers or reconstruction tasks.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMuscleFatFraction =
  | {
      /** Desired fraction or real MRI observation of the owning muscle. */
      readonly kind: "target";

      /** Dimensionless proton-density fat fraction in the inclusive interval zero to one. */
      readonly fraction: number;
    }
  | {
      /** Desired fraction or real MRI observation of the owning muscle. */
      readonly kind: "observed";

      /** Dimensionless proton-density fat fraction in the inclusive interval zero to one. */
      readonly fraction: number;

      /** MRI acquisition required for the supported fat-proton protocol. */
      readonly modality: "mri";

      /** Quantitative water-fat separation with multi-echo correction. */
      readonly method: "multi-echo-dixon-pdff";

      /** Body position when the named muscle was imaged. */
      readonly acquisitionPosture: AutoMovieHumanBodyAcquisitionPosture;

      /** Absolute fraction uncertainty; unknown when omitted. */
      readonly uncertaintyFraction?: number;
    };
