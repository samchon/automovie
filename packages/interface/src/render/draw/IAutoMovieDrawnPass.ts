import type { IAutoMovieSemanticMask } from "../IAutoMovieSemanticMask.js";
import type { AutoMovieInspectionShade } from "../inspection/AutoMovieInspectionShade";
import type { IAutoMovieInspectionDiagnostics } from "../inspection/IAutoMovieInspectionDiagnostics.js";
import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";
import type { IAutoMovieDrawnMouth } from "./IAutoMovieDrawnMouth.js";

/**
 * One decoded pass of a sampled subject frame. AutoMovieDrawSession.frame emits
 * records in requested pass order, using the same second, raster and film
 * camera for each; picture storage belongs to the caller.
 */
export interface IAutoMovieDrawnPass {
  /** Inspection shade or guide pass requested for this picture. */
  pass: AutoMovieInspectionShade;
  /** Owned decoded raster of this pass at the sampled second. */
  picture: IAutoMovieRasterImage;

  /** The draw page's findings and coverage from this sample, when supplied. */
  diagnostics?: IAutoMovieInspectionDiagnostics;

  /**
   * For the `mask` pass only: the semantic palette the page painted with, or
   * null when it painted the positional ramp; absent for every other pass.
   */
  semanticMask?: IAutoMovieSemanticMask | null;

  /**
   * The dialogue mouths the subject read for this picture's second, one per
   * actor; absent when the subject took no dialogue mouths.
   */
  mouths?: IAutoMovieDrawnMouth[];
}
