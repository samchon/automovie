/** Conditional rank diagnostics for the two supplied-camera designs. */
export interface IAutoMovieRecoveryImageDirectionRank {
  /** Squared-radius support design singular-value ratio. */
  radii: number;

  /** Centre-projection design singular-value ratio. */
  centres: number;
}
