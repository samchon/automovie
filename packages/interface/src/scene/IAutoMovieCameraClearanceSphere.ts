import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One camera-local spherical volume used for physical clearance.
 *
 * Radius is an authored conservative enclosure of the hardware, invariant under rotation; center permits an asymmetric body or rear mount. Between samples an offset center can follow an arc, so interval clearance additionally relies on the evaluator's interpolation and swept-bound premises. This type does not establish those motion bounds or actual hardware measurement.
 *
 * @evidence contracts/common.md#principled-implementation Finite local center and positive authored radius define a sphere transformed by sampled camera placement. Hardware enclosure is an author premise; continuous center motion and obstacle coverage need the evaluator's separate interval assumptions.
 * @evidence contracts/common.md#clear-and-simple-design Center offset accommodates asymmetric bodies and rear mounts using one portable primitive rather than renderer meshes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Radius is authored physical extent and does not shrink with view orientation or get inferred from the optical near plane.
 * @evidence contracts/common.md#meaningful-documentation Defines camera-local meter center, positive conservative radius and the asymmetrical placement purpose.
 * @author Samchon
 */
export interface IAutoMovieCameraClearanceSphere {
  /** Camera-local centre in metres. */
  center: IAutoMovieVector3;

  /** Conservative physical radius in metres, finite and greater than zero. */
  radius: number;
}
