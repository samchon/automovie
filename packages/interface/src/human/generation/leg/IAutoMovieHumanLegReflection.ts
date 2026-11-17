/** Type contracts exchanged by AutoMovieHumanLegReflection; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegReflection {
  /** Result of AutoMovieHumanLegReflection.sided. Control values of canonical in-plane samples on a side.
  @param local Section points `[x, z, lift]` in the canonical plane, one per phase.
  @param sign 1 for the left side, -1 for the right.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Control values of canonical in-plane samples on a side.
 * @evidence contracts/development/design.md#principled-representation `coefficients`: Reflected section coefficients in the same physical chart units. `lift`: Reflected lift coefficients, retaining their original phase parameter and derivative units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegReflection.ISidedResult is the canonical exchange used by AutoMovieHumanLegReflection.sided.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `coefficients`, `lift`; callers supply the complete record.
 */
  export type ISidedResult = {
    /** Reflected section coefficients in the same physical chart units. */
    coefficients: number[];
    /** Reflected lift coefficients, retaining their original phase parameter and derivative units. */
    lift: number[];
  };
}
