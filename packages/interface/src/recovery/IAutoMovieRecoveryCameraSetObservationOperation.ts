import type {
  IAutoMovieRecoveryCameraBudget,
  IAutoMovieRecoveryCameraPolicy,
  IAutoMovieRecoveryCameraSetObservation,
  IAutoMovieRecoveryCameraView,
} from "..";

/**
 * Callable extraction and reciprocal search over an already admitted camera
 * set.
 */
export namespace IAutoMovieRecoveryCameraSetObservationOperation {
  /**
   * Extract one feature population per view and preflight total directed
   * comparison work. Preserve both searches for each source pair, including
   * zero-work directions whose target has fewer than two descriptors. Progress
   * reports completed views and pairs. Work exhaustion or a thrown checkpoint
   * aborts.
   */
  export type Operation = (
    views: readonly IAutoMovieRecoveryCameraView[],
    policy: IAutoMovieRecoveryCameraPolicy,
    budget: IAutoMovieRecoveryCameraBudget,
    maximumComparisons: number,
    checkpoint: (phase: string, completed: number, total: number) => void,
  ) => IAutoMovieRecoveryCameraSetObservation;
}
