/**
 * Asymmetric vertical footprint reaches and a dimensionless radius evaluator on its millimetre plane. Runtime construction and admission remain with AutoMovieHumanBreastFootprint in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes asymmetric vertical footprint reaches and a dimensionless radius evaluator on its millimetre plane; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Asymmetric vertical footprint reaches and a dimensionless radius evaluator on its millimetre plane. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanBreastFootprint; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing BreastFootprint contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanBreastFootprint {
  /** The footprint.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The footprint.
   * @evidence contracts/development/design.md#principled-representation `half`: Lateral half width, mm. `lower`: Reach below the bust point, mm: its height over the fold. `upper`: Reach above it, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBreastFootprint.create. Also types AutoMovieHumanBreastDome.f.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `half`, `lower`, `upper`, `rho`; callers supply the complete record.
   */
  export interface IFootprint {
    /** Lateral half width, mm. */
    half: number;

    /** Reach below the bust point, mm: its height over the fold. */
    lower: number;

    /** Reach above it, mm. */
    upper: number;

    /**
     * The normalised radius of a point of the breast's plane.
     *
     * @param u Along the lateral axis, mm.
     * @param v Along the up axis, mm.
     * @returns The radius, 1 at the rim.
     */
    rho: (u: number, v: number) => number;
  }
}
