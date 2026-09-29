import type { AutoMovieHumanBodyAcquisitionPosture } from "./AutoMovieHumanBodyAcquisitionPosture";
import type { AutoMovieHumanBodyImagingModality } from "./AutoMovieHumanBodyImagingModality";

/** Directly imaged anatomical length in millimetres. @author Samchon */
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
