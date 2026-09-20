import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A camera's resolved world placement (position + rotation).
 *
 * @evidence requirements/camera/scope-and-identity.md#camera-spatial-state-binding Carries the world position and rotation resolved for one addressed camera at one sample time as a single projection input.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding IAutoMovieResolvedCamera realizes explicit camera spatial binding: A camera's resolved world placement (position + rotation).
 */
export interface IAutoMovieResolvedCamera {
  /**
   * Camera origin in world space.
   *
   * @evidence requirements/camera/scope-and-identity.md#camera-spatial-state-binding Stores the addressed camera's sampled world origin used by view-space projection and frustum tests.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding IAutoMovieResolvedCamera.position realizes explicit camera spatial binding: Camera origin in world space.
   */
  position: IAutoMovieVector3;
  /**
   * Camera orientation in world space.
   *
   * @evidence requirements/camera/scope-and-identity.md#camera-spatial-state-binding Stores the same addressed camera's sampled world orientation that defines its local viewing basis.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding IAutoMovieResolvedCamera.rotation realizes explicit camera spatial binding: Camera orientation in world space.
   */
  rotation: IAutoMovieQuaternion;
}
