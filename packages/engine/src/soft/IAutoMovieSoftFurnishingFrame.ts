import {
  IAutoMovieSoftAnalysis,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftBodySurface,
} from "@automovie/interface";

/**
 * One lowerSoftFurnishing result with its computation status and derived surface.
 *
 * @evidence contracts/common.md#principled-implementation Particle state and its surface accompany an explicit analysis status, so not-run nulls differ from rest geometry returned for a declared unsupported solve.
 * @evidence contracts/common.md#clear-and-simple-design Furnishing identity joins simulation and display derivatives in one result while domain configuration remains authored elsewhere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null state/surface expose an unperformed derivation, and unsupported/rest statuses do not claim a moving cloth simulation succeeded.
 * @evidence contracts/common.md#meaningful-documentation Names the lowering producer and distinguishes no computation from a drawable but explicitly unsolved rest state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result row performs neither integration nor surface construction; those algorithms are answered by its producers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work State and surface belong to one sampled furnishing result and this record coordinates no prior-frame reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned particle and mesh populations dominate retention; the wrapper holds no runtime host or external simulation task.
 */
export interface IAutoMovieSoftFurnishingFrame {
  /** Identity of the furnishing the frame belongs to. */
  furnishing: string;

  /**
   * What the analysis actually did, including anything it declined to claim.
   */
  analysis: IAutoMovieSoftAnalysis;

  /** The particle state, or `null` when nothing was computed at all. */
  state: IAutoMovieSoftBodyState | null;

  /** Drawable geometry derived from that state, or `null` beside it. */
  surface: IAutoMovieSoftBodySurface | null;
}
