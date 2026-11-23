/**
 * Reflected section and lift coefficient arrays retaining their source phase
 * clock. Runtime construction and admission remain with
 * AutoMovieHumanLegReflection in Human.
 */
export namespace IAutoMovieHumanLegReflection {
  /**
   * Side-reflected section coefficients and lift coefficients of the canonical
   * in-plane samples. Both arrays keep the original phase parameter and
   * millimetre chart units.
   */
  export type ISidedResult = {
    /** Reflected section coefficients in the same physical chart units. */
    coefficients: number[];
    /**
     * Reflected lift coefficients, retaining their original phase parameter and
     * derivative units.
     */
    lift: number[];
  };
}
