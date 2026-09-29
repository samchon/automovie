import type { AutoMovieHumanBodyAcquisitionPosture } from "./AutoMovieHumanBodyAcquisitionPosture";
import type { AutoMovieHumanBodyImagingModality } from "./AutoMovieHumanBodyImagingModality";

/** Directly imaged angle between named anatomical axes in degrees. @author Samchon */
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
