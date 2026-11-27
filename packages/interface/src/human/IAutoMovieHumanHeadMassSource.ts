import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";

/**
 * Type contracts exchanged by AutoMovieHumanHeadMassSource; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadMassSource {
  /** Existing public mass resolution, independent of anatomical dimensions. */
  export interface IDensity {
    /** Widest authored station interval in calibration millimetres. */
    spacing: number;
    /** Existing periodic compatibility-row order. */
    order: number;
    /** Existing display ring population. */
    samples: number;
  }

  /**
   * Result of AutoMovieHumanHeadMassSource.prepare. Prepare the common axis,
   * outlines and two lower named calipers once. Only cranial fullness and its
   * frontal point constraint vary with power. The caller owns this immutable
   * family; a changed layout, face exponent, boundary or density requires
   * another preparation, not a cross-trial cache.
   */
  export type PrepareResult = (cranialTapePower?: number) => IAutoMovieViewPart;
}
