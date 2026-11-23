import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A camera's world placement at one instant: where the lens is and which way it
 * is turned.
 *
 * `resolveCameraAt` produces it from the staged base transform, or from the
 * shot's camera clip sampled at that time, taking each missing track from the
 * base. `projectToNdc`, the perspective frustum tests and the visual-read and
 * film-grammar observations consume it; the camera looks down its local `-Z`
 * with `+Y` up, as glTF and `three.js` cameras do.
 */
export interface IAutoMovieResolvedCamera {
  /** Lens position in world space, metres. */
  position: IAutoMovieVector3;

  /**
   * World orientation as a unit quaternion taking the camera's local frame
   * (looking down `-Z`, `+Y` up) to world space.
   */
  rotation: IAutoMovieQuaternion;
}
