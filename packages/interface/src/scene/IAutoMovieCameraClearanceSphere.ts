import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One camera-local spherical volume used for physical clearance.
 *
 * A sphere is intentionally conservative. Its size does not shrink while the
 * camera or its host rig rotates, so an interval swept from two ordered sample
 * states cannot expose a corner the declared envelope forgot to carry.
 * `center` permits an asymmetric camera body or a rig extending behind the
 * optical origin without turning the portable boundary into renderer geometry.
 *
 * @author Samchon
 */
export interface IAutoMovieCameraClearanceSphere {
  /** Camera-local centre in metres. */
  center: IAutoMovieVector3;

  /** Conservative physical radius in metres, finite and greater than zero. */
  radius: number;
}
