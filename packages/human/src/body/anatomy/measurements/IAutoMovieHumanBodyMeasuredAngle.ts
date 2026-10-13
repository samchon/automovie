import type { AutoMovieHumanBodyAcquisitionPosture } from "./AutoMovieHumanBodyAcquisitionPosture";
import type { AutoMovieHumanBodyImagingModality } from "./AutoMovieHumanBodyImagingModality";

/**
 * Directly imaged angle between named anatomical axes in degrees.
 *
 * @evidence contracts/common.md#principled-implementation Observed degrees retain imaging modality and acquisition posture over axes named by their owning field.
 * @evidence contracts/common.md#clear-and-simple-design A common measured-angle interface centralizes observation provenance for target/observation unions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing uncertainty stays absent and an imaging label does not invent landmark accuracy.
 * @evidence contracts/common.md#meaningful-documentation Comments identify degree/sign ownership, clinical axes, modality/posture and unknown uncertainty.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Measured-angle metadata executes no axis fitting, image traversal or trigonometric solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This angle schema coordinates no cached bone-axis registration between observations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observation owns scalars rather than image buffers or active scanner resources.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredAngle {
  /** A real imaging observation rather than a fictional target. */
  readonly kind: "observed";

  /** Clinical angle using the axes and sign in the owning field. */
  readonly degrees: number;

  /** CT/MRI or calibrated projection radiography. */
  readonly modality: AutoMovieHumanBodyImagingModality;

  /** The pose in which bone axes were observed. */
  readonly acquisitionPosture: AutoMovieHumanBodyAcquisitionPosture;

  /** Absent when landmark uncertainty is not quantified. */
  readonly uncertaintyDegrees?: number;
}
