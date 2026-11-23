import type { IAutoMovieHumanReferenceOutlineTypes } from "./IAutoMovieHumanReferenceOutlineTypes";

/**
 * Type contracts exchanged by AutoMovieHumanReferenceOutlines; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanReferenceOutlines {
  /**
   * The gluteal mass's footprint about the buttock's most posterior point,
   * women and men apart, as {@link BREAST_FOOTPRINT}: the wall's line runs from
   * the gluteal fold to the back hull's first vertex toward iliocristale, the
   * medial edge toward the cleft. The down edge's spread is near its mean in
   * women (the fold reads at varying depth on the leg's sections).
   */
  export type IGlutealFootprint = {
    /**
     * Observed gluteal-footprint summary for the retained female reference
     * group.
     */
    readonly female: IAutoMovieHumanReferenceOutlineTypes.IFootprint;
    /** Observed gluteal-footprint summary for the retained male reference group. */
    readonly male: IAutoMovieHumanReferenceOutlineTypes.IFootprint;
  };
}
