import type { IAutoMovieLoftRelief } from "../../construction/IAutoMovieLoftRelief";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkFeatures; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanTrunkFeatures exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ISites, GuardedMake. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanTrunkFeatures; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ISites, GuardedMake contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanTrunkFeatures {
  /** What the features stand on: landmark heights and the tapes that size them.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the features stand on: landmark heights and the tapes that size them.
   * @evidence contracts/development/design.md#principled-representation `crotch`: Crotch height, mm. `buttock`: Buttock point height, mm. `iliocristale`: Iliocristale height, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkKeys.sites. Read by AutoMovieHumanTrunkFeatures.breastDome, AutoMovieHumanTrunkFeatures.breasts, AutoMovieHumanTrunkFeatures.glutealDome. Also types AutoMovieHumanTrunkClosure.sites, AutoMovieHumanTrunkSolver.where.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `crotch`, `buttock`, `iliocristale`, `omphalion`, `waist`, `fold`, `bust`, `axilla`, `furrowFrom`, `bustSpan`, `projection`, `buttockProjection`, `span`, `neck`; callers supply the complete record.
   */
  export interface ISites {
    /** Crotch height, mm. */
    crotch: number;

    /** Buttock point height, mm. */
    buttock: number;

    /** Iliocristale height, mm. */
    iliocristale: number;

    /** Omphalion height, mm. */
    omphalion: number;

    /** Natural waist height, mm: the row where the furrow's phase span is read. */
    waist: number;

    /** Inframammary fold height, mm. */
    fold: number;

    /** Bust point height, mm. */
    bust: number;

    /** Axilla height, mm: the top of the trunk's chain. */
    axilla: number;

    /** The furrow's lower end, mm. */
    furrowFrom: number;

    /** The bust span, mm: the breadth between the bust points. */
    bustSpan: number;

    /** The breasts' projection over the chest wall at the bust point, mm: what the chest tape closes over the wall. */
    projection: number;

    /** What the base's back lacks at the buttock point for the buttock's depth, mm: the buttock's projection. */
    buttockProjection: number;

    /** The crotch-to-cervicale span, mm: the blades' reach is a share of it. */
    span: number;

    /** Height of the neck's bottom ring, the shoulders' top, mm: the windows near the neck stay under it. */
    neck: number;
  }

  /** The make argument of AutoMovieHumanTrunkFeatures.guarded. An optional piece's windows, or none and one diagnostic when it breaks
  its contract.
  @param producer The piece's name.
  @param level Its construction level.
  @param diagnostics The list a broken piece is recorded in.
  @param make The piece's windows.
  @returns The windows, or none.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation An optional piece's windows, or none and one diagnostic when it breaks its contract.
 * @evidence contracts/development/design.md#principled-representation An optional piece's windows, or none and one diagnostic when it breaks its contract. The callable takes  and returns IAutoMovieLoftRelief[].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkFeatures.GuardedMake is the canonical exchange used by AutoMovieHumanTrunkFeatures.guarded.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkFeatures.guarded for an optional piece's windows, or none and one diagnostic when it breaks its contract.
 */
  export type GuardedMake = () => IAutoMovieLoftRelief[];
}
