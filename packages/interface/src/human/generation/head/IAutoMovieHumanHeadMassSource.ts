import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanHeadMassSource; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadMassSource {
  /** Existing public mass resolution, independent of anatomical dimensions.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Existing public mass resolution, independent of anatomical dimensions.
   * @evidence contracts/development/design.md#principled-representation `spacing`: Widest authored station interval in calibration millimetres. `order`: Existing periodic compatibility-row order. `samples`: Existing display ring population.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadMassSource.of, AutoMovieHumanHeadMassSource.prepare.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `spacing`, `order`, `samples`; callers supply the complete record.
   */
  export interface IDensity {
    /** Widest authored station interval in calibration millimetres. */
    spacing: number;
    /** Existing periodic compatibility-row order. */
    order: number;
    /** Existing display ring population. */
    samples: number;
  }

  /** Result of AutoMovieHumanHeadMassSource.prepare. Prepare the common axis, outlines and two lower named calipers once.
  Only cranial fullness and its frontal point constraint vary with power.
  The caller owns this immutable family; a changed layout, face exponent,
  boundary or density requires another preparation, not a cross-trial cache.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepare the common axis, outlines and two lower named calipers once.
 * @evidence contracts/development/design.md#principled-representation Prepare the common axis, outlines and two lower named calipers once. The callable takes cranialTapePower (optional) and returns IAutoMovieViewPart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadMassSource.PrepareResult is the canonical exchange used by AutoMovieHumanHeadMassSource.prepare.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadMassSource.prepare for prepare the common axis, outlines and two lower named calipers once.
 */
  export type PrepareResult = (cranialTapePower?: number) => IAutoMovieViewPart;
}
