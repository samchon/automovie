/**
 * Actual admission and coefficient populations in an assembled field complex.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 */
export interface IAutoMovieRecoveryFieldComplexCounts {
  /** Number of supplied chart declarations. */
  requestedCharts: number;

  /** Number of retained compiled charts. */
  compiledCharts: number;

  /** Number of retained tensor patches. */
  patches: number;

  /** Number of retained named boundary authorities. */
  sharedCubicAuthorities: number;

  /** Number of compacted final recipe controls. */
  controls: number;
}
