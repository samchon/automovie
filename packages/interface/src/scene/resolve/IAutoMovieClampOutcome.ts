import type { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";

/** The clamped value plus the list of bounds it crossed (empty if in range). */
export interface IAutoMovieClampOutcome {
  /** The value after clamping, same length as the input. */
  value: number[];

  /** Every component/bound that was exceeded, in component order. */
  violations: IAutoMovieClampViolation[];
}
