import type { IAutoMovieRecoveryMapLandmark } from "../image/IAutoMovieRecoveryMapLandmark";

/**
 * Detached point/measurement growth proposal before joint acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Proposed original measurements and points remain separate from strict increases that justify another closure fit.
 * @evidence contracts/common.md#clear-and-simple-design One named internal result binds proposed data to its monotonic growth diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Proposed geometry is not an accepted checkpoint and no removed observation supplies apparent growth.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish total proposed population from newly added points and observations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result performs no fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The transaction consumes the same proposal in its next joint objective.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The transaction owns bounded detached arrays and discards them on failure.
 */
export interface IAutoMovieRecoverySceneGrowth {
  /** Complete detached proposed landmark population. */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Strict count increase in proposed points. */
  addedLandmarks: number;

  /** Strict count increase in retained measurements, including new-point observations. */
  addedObservations: number;
}
