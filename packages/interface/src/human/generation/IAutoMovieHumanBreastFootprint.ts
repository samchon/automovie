/** Type contracts exchanged by AutoMovieHumanBreastFootprint; runtime evaluation remains in Human. */
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
