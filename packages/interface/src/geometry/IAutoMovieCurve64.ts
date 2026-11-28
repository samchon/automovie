/** Source provenance shared by the Bernstein piece variants. */
export namespace IAutoMovieCurve64 {
  /**
   * Optional source-chart metadata for a Bernstein piece. The local interval is
   * [0,1]. An authored q interval describes source extent while evaluation
   * keeps derivatives in the normalized local parameter.
   */
  export interface PieceMetadata {
    /** Optional explicit local interval. When present, supply [0,1]. */
    parameterDomain?: readonly [number, number];

    /**
     * Optional finite increasing interval in the source q chart. Its width is
     * descriptive and leaves local-parameter derivatives unchanged.
     */
    qInterval?: readonly [number, number];
  }
}
