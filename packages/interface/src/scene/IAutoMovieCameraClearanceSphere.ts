import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One camera-local spherical volume used for physical clearance.
 *
 * Radius is an authored conservative enclosure of the hardware, invariant under rotation; center permits an asymmetric body or rear mount. Between samples an offset center can follow an arc, so interval clearance additionally relies on the evaluator's interpolation and swept-bound premises. This type does not establish those motion bounds or actual hardware measurement.
 *
 * @evidence contracts/development/design.md#principled-representation Finite local center and positive authored radius define a sphere transformed by sampled camera placement. Hardware enclosure is an author premise; continuous center motion and obstacle coverage need the evaluator's separate interval assumptions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Center offset accommodates asymmetric bodies and rear mounts using one portable primitive rather than renderer meshes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Radius is authored physical extent and does not shrink with view orientation or get inferred from the optical near plane.
 * @evidence contracts/development/common.md#meaningful-documentation Defines camera-local meter center, positive conservative radius and the asymmetrical placement purpose.
 */
export interface IAutoMovieCameraClearanceSphere {
  /** Camera-local centre in metres. */
  center: IAutoMovieVector3;

  /** Conservative physical radius in metres, finite and greater than zero. */
  radius: number;
}
