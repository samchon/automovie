import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One hard target in a complete softBodyBoundarySample, resolved at an absolute step.
 *
 * @evidence contracts/development/design.md#principled-representation A row-major particle index and metre world target state one Dirichlet position boundary, separate from node/bone bindings the wearable resolver already evaluated.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cloth solver receives resolved geometry rather than depending on actor or scene-node sampling machinery.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing target is not represented by an origin default; complete boundary admission refuses absent or repeated authored moving anchors.
 * @evidence contracts/development/common.md#meaningful-documentation Names the complete-boundary context, absolute sampling and particle/world-position coordinate meanings.
 */
export interface IAutoMovieSoftBodyResolvedAnchor {
  /** Anchored row-major particle index. */
  particle: number;

  /** World-space target sampled for this step. */
  position: IAutoMovieVector3;
}
