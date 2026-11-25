import type {
  IAutoMovieRecoveryCameraBudget,
  IAutoMovieRecoveryCameraPolicy,
  IAutoMovieRecoveryCameraSetObservation,
  IAutoMovieRecoveryCameraView,
} from "../../index";

/**
 * Once-per-image Harris observations and bidirectional descriptor matches for
 * supplied calibrated RGB views. Pixel buffers remain borrowed and unchanged
 * until return. maximumComparisons bounds aggregate directed descriptor work
 * before traversal. The synchronous checkpoint receives phase, completed and
 * planned counts; throwing stops computation. Invalid admission or exhausted
 * work throws; returned features and matches remain conditional appearance
 * evidence.
 */
export namespace IAutoMovieRecoveryCameraSetObservationOperation {
  /**
   * Once-per-image Harris observations and bidirectional descriptor matches for
   * supplied calibrated RGB views. Pixel buffers remain borrowed and unchanged
   * until return. maximumComparisons bounds aggregate directed descriptor work
   * before traversal. The synchronous checkpoint receives phase, completed and
   * planned counts; throwing stops computation. Invalid admission or exhausted
   * work throws; returned features and matches remain conditional appearance
   * evidence.
   */
  export type Operation = (
    views: readonly IAutoMovieRecoveryCameraView[],
    policy: IAutoMovieRecoveryCameraPolicy,
    budget: IAutoMovieRecoveryCameraBudget,
    maximumComparisons: number,
    checkpoint: (phase: string, completed: number, total: number) => void,
  ) => IAutoMovieRecoveryCameraSetObservation;
}
