/**
 * Retained triangle interval and chart bounds for one atlas patch.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/common.md#clear-and-simple-design One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and acquire no external resources.
 */
export interface IAutoMovieRecoveryAtlasPrimitiveRange {
  /** Generating patch identity. */
  patch: string;

  /** First triangle ordinal in the generated mesh. */
  firstTriangle: number;

  /** Number of consecutive retained triangles. */
  triangleCount: number;

  /** Lower local U bound. */
  u0: number;

  /** Upper local U bound. */
  u1: number;

  /** Lower local V bound. */
  v0: number;

  /** Upper local V bound. */
  v1: number;

  /** Retained field approximation bound in millimetres. */
  approximationBoundMm: number;
}
