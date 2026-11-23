import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One camera-local spherical volume used for physical clearance.
 *
 * Radius is an authored conservative enclosure of the hardware, invariant under
 * rotation; center permits an asymmetric body or rear mount. Between samples an
 * offset center can follow an arc, so interval clearance additionally relies on
 * the evaluator's interpolation and swept-bound premises. This type does not
 * establish those motion bounds or actual hardware measurement.
 */
export interface IAutoMovieCameraClearanceSphere {
  /** Camera-local centre in metres. */
  center: IAutoMovieVector3;

  /** Conservative physical radius in metres, finite and greater than zero. */
  radius: number;
}
