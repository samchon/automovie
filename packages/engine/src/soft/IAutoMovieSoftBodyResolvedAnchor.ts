import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One hard target in a complete softBodyBoundarySample, resolved at an absolute step.
 *
 * @evidence contracts/common.md#principled-implementation A row-major particle index and metre world target state one Dirichlet position boundary, separate from node/bone bindings the wearable resolver already evaluated.
 * @evidence contracts/common.md#clear-and-simple-design The cloth solver receives resolved geometry rather than depending on actor or scene-node sampling machinery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing target is not represented by an origin default; complete boundary admission refuses absent or repeated authored moving anchors.
 * @evidence contracts/common.md#meaningful-documentation Names the complete-boundary context, absolute sampling and particle/world-position coordinate meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This target row performs no frame resolution or integration; those costs belong to wearable resolution and the solver.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One target belongs to one step, and reuse of immutable resolved storage is the supplying sampler's responsibility.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The supplying boundary owns the position reference and particle scalar; this row acquires no rig, animation cursor or host task.
 */
export interface IAutoMovieSoftBodyResolvedAnchor {
  /** Anchored row-major particle index. */
  particle: number;

  /** World-space target sampled for this step. */
  position: IAutoMovieVector3;
}
