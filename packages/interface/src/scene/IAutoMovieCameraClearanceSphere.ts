import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One camera-local spherical volume used for physical clearance.
 *
 * A sphere is intentionally conservative. Its size does not shrink while the camera or its host rig rotates, so an interval swept from two ordered sample states cannot expose a corner the declared envelope forgot to carry. `center` permits an asymmetric camera body or a rig extending behind the optical origin without turning the portable boundary into renderer geometry.
 *
 * @evidence contracts/common.md#principled-implementation A finite local center and positive radius define a rotation-invariant conservative sphere transformed by sampled camera placement for clearance evaluation.
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
