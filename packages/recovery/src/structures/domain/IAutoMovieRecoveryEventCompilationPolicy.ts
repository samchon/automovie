/**
 * Finite patch and realization budgets for one local cubic-boundary chart.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
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
