import { IAutoMovieSoftBodyState } from "@automovie/interface";

import { IAutoMovieWearableSoftBudget } from "./IAutoMovieWearableSoftBudget";

/**
 * CPU cloth state and admission facts returned by simulateAutoMovieWearableSoftBody.
 *
 * @evidence contracts/development/design.md#principled-representation Solved particle state is kept distinct from subject-selection and moving-boundary cost facts, so an admitted budget is not mistaken for proof of cloth stability.
 * @evidence contracts/development/design.md#minimal-and-owned-surface State reuses the shared soft-body result while the separate wearable budget adds only live-boundary admission information needed by consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No renderer readiness or visual-fit flag is inferred from CPU completion; state and budget expose only their actual numerical/admission meanings.
 * @evidence contracts/development/common.md#meaningful-documentation Names the producing API and distinguishes CPU-reference state from the explicit moving-boundary population report.
 */
export interface IAutoMovieWearableSoftResult {
  /** Deterministic CPU-reference cloth state. */
  state: IAutoMovieSoftBodyState;

  /** Exact moving-boundary cost facts. */
  budget: IAutoMovieWearableSoftBudget;
}
