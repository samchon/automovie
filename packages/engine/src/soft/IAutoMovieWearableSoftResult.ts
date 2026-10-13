import type { IAutoMovieSoftBodyState } from "@automovie/interface";

import { IAutoMovieWearableSoftBudget } from "./IAutoMovieWearableSoftBudget";

/** Wearable cloth state and its explicit admission report. */
export interface IAutoMovieWearableSoftResult {
  /** Deterministic CPU-reference cloth state. */
  state: IAutoMovieSoftBodyState;
  /** Exact moving-boundary cost facts. */
  budget: IAutoMovieWearableSoftBudget;
}
