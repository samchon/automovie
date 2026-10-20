/**
 * Finite continuous-planning and tessellation limits for a convex-support loft.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/common.md#clear-and-simple-design This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache or completed operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no resources.
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
