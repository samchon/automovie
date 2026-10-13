import { IAutoMoviePatternFinding } from "./IAutoMoviePatternFinding";
import { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import { IAutoMoviePatternQuantities } from "./IAutoMoviePatternQuantities";

/** Everything one deterministic pattern run produces. */
export interface IAutoMovieSurfacePatternResult {
  /** The pattern that produced this run. */
  id: string;
  /** Occurrences in zone, row, column, then generator order. */
  placements: IAutoMoviePatternPlacement[];
  /** The take-off. */
  quantities: IAutoMoviePatternQuantities;
  /** Structured defects, per-occurrence ones first, then per-pair ones. */
  findings: IAutoMoviePatternFinding[];
}
