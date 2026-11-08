/**
 * Retained triangle interval and chart bounds for one atlas patch.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
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
