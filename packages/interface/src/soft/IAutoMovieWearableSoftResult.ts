import type { IAutoMovieSoftBodyState } from "./IAutoMovieSoftBodyState";
import type { IAutoMovieWearableSoftBudget } from "./IAutoMovieWearableSoftBudget";

/**
 * CPU cloth state and admission facts returned by
 * simulateAutoMovieWearableSoftBody.
 */
export interface IAutoMovieWearableSoftResult {
  /** Deterministic CPU-reference cloth state. */
  state: IAutoMovieSoftBodyState;

  /** Exact moving-boundary cost facts. */
  budget: IAutoMovieWearableSoftBudget;
}
