/**
 * Numerical populations and error bound returned by the atlas realizer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cells retained when the requested approximation was not reached. Degenerate output triangles omitted by the engine.
 * @evidence contracts/development/design.md#principled-representation Largest retained field approximation bound in millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAtlasRealization, IAutoMovieRecoveryTensorReport share IAutoMovieRecoveryAtlasCounts's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Cells retained when the requested approximation was not reached.
 */

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
