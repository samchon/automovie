import type { IAutoMovieRecoverySceneCandidate } from "..";

/** One support-ranked camera candidate at an accepted component revision. */
export interface IAutoMovieRecoverySceneQueue {
  /** Fixed input source index. */
  view: number;

  /** Distinct existing-map candidates, not PnP inliers. */
  candidates: IAutoMovieRecoverySceneCandidate[];
}
