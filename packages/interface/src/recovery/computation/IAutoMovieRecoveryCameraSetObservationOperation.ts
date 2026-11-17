import type {
  IAutoMovieRecoveryCameraBudget,
  IAutoMovieRecoveryCameraPolicy,
  IAutoMovieRecoveryCameraSetObservation,
  IAutoMovieRecoveryCameraView,
} from "../../index";

/**
 * Once-per-image Harris observations and bidirectional descriptor matches for supplied calibrated RGB views. Pixel buffers remain borrowed and unchanged until return. maximumComparisons bounds aggregate directed descriptor work before traversal. The synchronous checkpoint receives phase, completed and planned counts; throwing stops computation. Invalid admission or exhausted work throws; returned features and matches remain conditional appearance evidence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for observeRecoveryCameraSet.
 * @evidence contracts/development/design.md#principled-representation Once-per-image Harris observations and bidirectional descriptor matches for supplied calibrated RGB views.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoveryCameraSet and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by observeRecoveryCameraSet; the type does not certify input validity.
 */
export namespace IAutoMovieRecoveryCameraSetObservationOperation {
  /**
   * Once-per-image Harris observations and bidirectional descriptor matches for supplied calibrated RGB views. Pixel buffers remain borrowed and unchanged until return. maximumComparisons bounds aggregate directed descriptor work before traversal. The synchronous checkpoint receives phase, completed and planned counts; throwing stops computation. Invalid admission or exhausted work throws; returned features and matches remain conditional appearance evidence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for observeRecoveryCameraSet.
   * @evidence contracts/development/design.md#principled-representation Once-per-image Harris observations and bidirectional descriptor matches for supplied calibrated RGB views.
   * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoveryCameraSet and its typed callers share this signature and the referenced canonical input and result records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by observeRecoveryCameraSet; the type does not certify input validity.
   */
  export type Operation = (
    views: readonly IAutoMovieRecoveryCameraView[],
    policy: IAutoMovieRecoveryCameraPolicy,
    budget: IAutoMovieRecoveryCameraBudget,
    maximumComparisons: number,
    checkpoint: (phase: string, completed: number, total: number) => void,
  ) => IAutoMovieRecoveryCameraSetObservation;
}
