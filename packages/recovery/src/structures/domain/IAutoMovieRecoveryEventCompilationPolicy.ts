/**
 * Finite patch and realization budgets for one local cubic-boundary chart.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/common.md#clear-and-simple-design This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache or completed operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no resources.
 */
export interface IAutoMovieRecoveryEventCompilationPolicy {
  /** Positive integer maximum bicubic patches. */
  maxPatches: number;

  /** Positive integer maximum realization cells. */
  maxCells: number;

  /** Positive integer maximum realization vertices. */
  maxVertices: number;

  /** Positive physical chord tolerance, millimetres. */
  toleranceMm: number;

  /** When true, external chart endpoints are evaluated from their declared native parents. */
  nativeParentBindings?: boolean;
}
