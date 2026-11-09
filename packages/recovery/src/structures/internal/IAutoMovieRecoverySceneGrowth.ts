import type { IAutoMovieRecoveryMapLandmark } from "../image/IAutoMovieRecoveryMapLandmark";

/**
 * Detached point/measurement growth proposal before joint acceptance.
 *
 * @evidence contracts/development/design.md#principled-representation Proposed original measurements and points remain separate from strict increases that justify another closure fit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named internal result binds proposed data to its monotonic growth diagnostics.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Proposed geometry is not an accepted checkpoint and no removed observation supplies apparent growth.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish total proposed population from newly added points and observations.
 */
export interface IAutoMovieRecoverySceneGrowth {
  /** Complete detached proposed landmark population. */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Strict count increase in proposed points. */
  addedLandmarks: number;

  /** Strict count increase in retained measurements, including new-point observations. */
  addedObservations: number;
}
