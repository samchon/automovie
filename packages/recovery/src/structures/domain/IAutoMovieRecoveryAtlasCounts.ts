/**
 * Numerical populations and error bound returned by the atlas realizer.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
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
