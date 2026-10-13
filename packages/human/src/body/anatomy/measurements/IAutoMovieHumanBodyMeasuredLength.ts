import type { AutoMovieHumanBodyAcquisitionPosture } from "./AutoMovieHumanBodyAcquisitionPosture";
import type { AutoMovieHumanBodyImagingModality } from "./AutoMovieHumanBodyImagingModality";

/**
 * Directly imaged anatomical length in millimetres.
 *
 * @evidence contracts/common.md#principled-implementation Observed millimetres retain modality/posture context and refer to landmarks supplied by the owning anatomical quantity.
 * @evidence contracts/common.md#clear-and-simple-design One shared length observation contract avoids repeating imaging provenance in each bone measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Imaging distance is not replaced by skin length or transferred to standing pose without registration grounds.
 * @evidence contracts/common.md#meaningful-documentation Member prose names landmark distance, millimetre uncertainty and posture-transfer obligations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Measured-length typing executes no bone-landmark detection or image calibration algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This observation interface holds no reusable registered-landmark solve across acquisitions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Length observations acquire no decoded scans, calibration handles or generated bone buffers.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredLength {
  /** A real imaging observation, rather than a fictional target. */
  readonly kind: "observed";

  /** Distance between the anatomical landmarks named by its owning field. */
  readonly millimetres: number;

  /** CT/MRI or calibrated projection radiography. */
  readonly modality: AutoMovieHumanBodyImagingModality;

  /** Needed before transferring this observation to a standing body. */
  readonly acquisitionPosture: AutoMovieHumanBodyAcquisitionPosture;

  /** Absent when landmark uncertainty is not quantified. */
  readonly uncertaintyMillimetres?: number;
}
