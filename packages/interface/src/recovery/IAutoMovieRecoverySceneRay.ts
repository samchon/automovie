/**
 * One registered camera's direction toward the evaluated point in the common
 * world frame.
 */
export interface IAutoMovieRecoverySceneRay {
  /** Original source index of the camera that supplied this ray. */
  view: number;

  /** Normalized X, Y and Z components in the common reconstruction world frame. */
  unit: number[];
}
