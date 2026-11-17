/**
 * Finite continuous-planning and tessellation limits for a convex-support loft.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Positive model-space chord tolerance, metres. Maximum support-plane count; at least three surrounding directions are required.
 * @evidence contracts/development/design.md#principled-representation Positive model-space chord tolerance, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieRecoverySupportLoft share IAutoMovieRecoverySupportLoftBudget's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
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
