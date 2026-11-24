/**
 * Protected intervals and junctions of native source controls.
 */
export namespace IAutoMovieHumanNativeControlLaw {
  /**
   * Distinct exact contracts: one whole polynomial interval or one complete boundary jet.
   */
  export type IProtection =
    | { type: "interval"; domain: readonly [number, number] }
    | { type: "junction"; station: number };
}
