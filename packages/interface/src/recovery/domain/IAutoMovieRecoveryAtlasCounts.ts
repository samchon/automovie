/** Numerical populations and error bound returned by the atlas realizer. */

export interface IAutoMovieRecoveryAtlasCounts {
  /** Cells retained when the requested approximation was not reached. */
  retainedCoarseCells: number;

  /** Degenerate output triangles omitted by the engine. */
  omittedZeroAreaTriangles: number;

  /** Output vertices whose normal could not be qualified. */
  unresolvedVertexNormals: number;

  /** Largest retained field approximation bound in millimetres. */
  maxErrorBoundMm: number;
}
