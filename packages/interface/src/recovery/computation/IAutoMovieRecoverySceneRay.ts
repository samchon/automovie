/** One actual registered camera's world-frame point direction. */
export interface IAutoMovieRecoverySceneRay {
  /** Index in the original source array. */
  view: number;

  /** Three unit direction coefficients in the common world frame. */
  unit: number[];
}
