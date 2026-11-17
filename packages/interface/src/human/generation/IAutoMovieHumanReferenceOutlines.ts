import type { IAutoMovieHumanReferenceOutlineTypes } from "./IAutoMovieHumanReferenceOutlineTypes";

/** Type contracts exchanged by AutoMovieHumanReferenceOutlines; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanReferenceOutlines {
  /** The gluteal mass's footprint about the buttock's most posterior point,
  women and men apart, as {@link BREAST_FOOTPRINT}: the wall's line runs
  from the gluteal fold to the back hull's first vertex toward iliocristale,
  the medial edge toward the cleft. The down edge's spread is near its
  mean in women (the fold reads at varying depth on the leg's sections).
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The gluteal mass's footprint about the buttock's most posterior point, women and men apart, as {@link BREAST_FOOTPRINT}: the wall's line runs from the gluteal fold to the back hull's first vertex toward iliocristale, the medial edge toward the cleft.
 * @evidence contracts/development/design.md#principled-representation `female`: Observed gluteal-footprint summary for the retained female reference group. `male`: Observed gluteal-footprint summary for the retained male reference group.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanReferenceOutlines.IGlutealFootprint is the canonical exchange used by AutoMovieHumanReferenceOutlines.GLUTEAL_FOOTPRINT.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `female`, `male`; callers supply the complete record.
 */
  export type IGlutealFootprint = {
    /** Observed gluteal-footprint summary for the retained female reference group. */
    readonly female: IAutoMovieHumanReferenceOutlineTypes.IFootprint;
    /** Observed gluteal-footprint summary for the retained male reference group. */
    readonly male: IAutoMovieHumanReferenceOutlineTypes.IFootprint;
  };
}
