/**
 * Numerical populations and error bound returned by the atlas realizer.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/common.md#clear-and-simple-design One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and acquire no external resources.
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
