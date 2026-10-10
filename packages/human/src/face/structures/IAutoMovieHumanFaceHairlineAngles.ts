/**
 * Named extent of the shared scalp growth mask. Polar degrees are measured from the domain's superior axis; larger angles admit roots farther from the crown. This is an authored region mask, not a measured hair-loss grade or reconstructed follicle boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairlineAngles {
  /** Anterior polar limit in [0,180] degrees. */
  frontDegrees: number;

  /** Independent anatomical-left polar limit in [0,180] degrees. */
  leftDegrees: number;

  /** Independent anatomical-right polar limit in [0,180] degrees. */
  rightDegrees: number;

  /** Posterior polar limit in [0,180] degrees. */
  backDegrees: number;
}
