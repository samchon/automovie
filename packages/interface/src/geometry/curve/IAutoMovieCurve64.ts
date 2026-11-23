/** Optional source provenance shared only by the Bernstein piece alternatives. */
export namespace IAutoMovieCurve64 {
  /**
   * Optional provenance for a Bernstein piece: parameterDomain, when present,
   * is [0,1]; qInterval is descriptive source extent and does not rescale
   * local-t derivatives.
   */
  export interface PieceMetadata {
    /**
     * Optional descriptive source interval; evaluation still returns
     * derivatives per normalized local t.
     */
    parameterDomain?: readonly [number, number];

    /**
     * Optional source q interval; it records provenance and does not silently
     * rescale local-t derivatives.
     */
    qInterval?: readonly [number, number];
  }
}
