/**
 * Asymmetric vertical footprint reaches and a dimensionless radius evaluator on
 * its millimetre plane. Runtime construction and admission remain with
 * AutoMovieHumanBreastFootprint in Human.
 */
export namespace IAutoMovieHumanBreastFootprint {
  /** The footprint. */
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
