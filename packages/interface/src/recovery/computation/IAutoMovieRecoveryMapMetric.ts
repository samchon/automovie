import type { IAutoMovieSimplexAtom } from "../../index";

/**
 * Invertible point-first upper-factor metric in physical camera-then-point
 * coordinates.
 */
export interface IAutoMovieRecoveryMapMetric {
  /** Camera width plus three coordinates for each ordered landmark. */
  width: number;

  /** Apply inverse-transpose upper-factor action to a physical covector. */
  whiten: (row: IAutoMovieSimplexAtom) => IAutoMovieSimplexAtom;

  /**
   * Apply inverse upper-factor action and restore physical parameter column
   * units.
   */
  unwhiten: (step: readonly number[]) => number[];

  /** Multiply by the physical metric factor transpose, in camera-first order. */
  toPhysicalCovector: (value: readonly number[]) => number[];
}
