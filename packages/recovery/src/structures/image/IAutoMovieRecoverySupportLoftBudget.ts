/**
 * Finite continuous-planning and tessellation limits for a convex-support loft.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 */
export interface IAutoMovieRecoverySupportLoftBudget {
  /** Positive model-space chord tolerance, metres. */
  tolerance: number;

  /** Maximum support-plane count; at least three surrounding directions are required. */
  maxPlanes: number;

  /** Nonnegative integer maximum retained boundary events. */
  maxEvents: number;

  /** Positive integer maximum tessellation cells. */
  maxCells: number;

  /** Positive integer maximum generated vertices. */
  maxVertices: number;

  /** Positive minimum plane-pair direction sine, strictly less than one. */
  minimumDirectionSine: number;
}
