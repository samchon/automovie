import type { IAutoMovieSimplexAtom } from "../../index";

/** One fixed-population objective and hard-constraint linearization. */
export interface IAutoMovieRecoveryFeasibleModel {
  /**
   * Objective gradient first, then all hard constraints, in common metric
   * coordinates.
   */
  rows: readonly IAutoMovieSimplexAtom[];

  /** Same ordered rows in original physical tangent coordinates. */
  physicalRows: readonly IAutoMovieSimplexAtom[];

  /** Full physical tangent dimension, including cameras and all points. */
  width: number;

  /** Convert a metric step to increments in the same physical tangent chart. */
  fromMetric: (step: readonly number[]) => number[];

  /** Push a metric covector into the original physical tangent units. */
  toPhysicalCovector?: (value: readonly number[]) => number[];
}
