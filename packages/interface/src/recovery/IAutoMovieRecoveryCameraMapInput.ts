import type { IAutoMovieRecoveryCameraBudget } from "./IAutoMovieRecoveryCameraBudget";
import type { IAutoMovieRecoveryCameraMapBudget } from "./IAutoMovieRecoveryCameraMapBudget";
import type { IAutoMovieRecoveryCameraMapPolicy } from "./IAutoMovieRecoveryCameraMapPolicy";
import type { IAutoMovieRecoveryCameraPairInput } from "./IAutoMovieRecoveryCameraPairInput";
import type { IAutoMovieRecoveryCameraPolicy } from "./IAutoMovieRecoveryCameraPolicy";
import type { IAutoMovieRecoveryCameraView } from "./IAutoMovieRecoveryCameraView";

/**
 * Three calibrated fixed RGB charts for an automatic partial sparse camera map.
 * Views zero and one are the explicitly ordered seed. The third is registered
 * only against their triangulated points, then all three poses/points are
 * jointly refined with the first pose and seed baseline scale fixed. Intrinsics
 * remain supplied assertions; this operation neither estimates them nor
 * recovers a surface.
 */
export interface IAutoMovieRecoveryCameraMapInput {
  /** Versioned three-view resident input. */
  schema: "automovie-recovery-camera-map-input-v1";

  /** Caller-asserted fixed scene identity. */
  objectId: string;

  /** Caller asserts that all views observe one rigid scene. */
  rigidity: IAutoMovieRecoveryCameraPairInput["rigidity"];

  /**
   * Keeps analytic, photographic and inconsistent-control measurements
   * separate.
   */
  cohort: IAutoMovieRecoveryCameraPairInput["cohort"];

  /**
   * Exactly three unique identities; indices zero and one are the seed. Keep
   * all borrowed RGB bytes unchanged until synchronous return.
   */
  views: IAutoMovieRecoveryCameraView[];

  /** Unchanged feature, matching and two-view qualification operating point. */
  seedPolicy: IAutoMovieRecoveryCameraPolicy;

  /**
   * Existing pair limits: maxPixels covers the seed pair; candidate/features
   * limits apply per image and descriptor pairs per pair.
   */
  seedBudget: IAutoMovieRecoveryCameraBudget;

  /** Explicit per-point and 3D-to-2D reprojection operating point. */
  policy: IAutoMovieRecoveryCameraMapPolicy;

  /** Aggregate map and new numerical work limits. */
  budget: IAutoMovieRecoveryCameraMapBudget;
}
