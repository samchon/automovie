import type { IAutoMovieRecoveryCameraBudget } from "./IAutoMovieRecoveryCameraBudget";
import type { IAutoMovieRecoveryCameraMapBudget } from "./IAutoMovieRecoveryCameraMapBudget";
import type { IAutoMovieRecoveryCameraMapPolicy } from "./IAutoMovieRecoveryCameraMapPolicy";
import type { IAutoMovieRecoveryCameraPairInput } from "./IAutoMovieRecoveryCameraPairInput";
import type { IAutoMovieRecoveryCameraPolicy } from "./IAutoMovieRecoveryCameraPolicy";
import type { IAutoMovieRecoveryCameraView } from "./IAutoMovieRecoveryCameraView";

/**
 * Three calibrated fixed RGB charts for an automatic partial sparse camera map.
 * Views zero and one are the explicitly ordered seed. The third is registered
 * only against their triangulated points, then all three poses/points are jointly
 * refined with the first pose and seed baseline scale fixed. Intrinsics remain
 * supplied assertions; this operation neither estimates them nor recovers a surface.
 *
 * @evidence contracts/common.md#principled-implementation A common rigid scene and corrected pinhole charts define calibrated seed/resection geometry. Automatic feature identities provide tentative tracks, while independent point and reprojection gates qualify fitting evidence.
 * @evidence contracts/common.md#clear-and-simple-design Shared view and pair policies keep existing semantics; map policy and budgets own new reprojection, track and joint-optimization work. Exactly three views delimit the first supported registration loop.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No manual correspondence, source mesh, truth pose, metric scale, inferred calibration or invisible-region completion enters the contract.
 * @evidence contracts/common.md#meaningful-documentation States borrowed RGB lifetime, explicit seed ordering, three-view support, known calibration, unknown physical scale and separate seed versus map budgets.
 */
export interface IAutoMovieRecoveryCameraMapInput {
  /** Versioned three-view resident input. */
  schema: "automovie-recovery-camera-map-input-v1";

  /** Caller-asserted fixed scene identity. */
  objectId: string;

  /** Caller asserts that all views observe one rigid scene. */
  rigidity: IAutoMovieRecoveryCameraPairInput["rigidity"];

  /** Keeps analytic, photographic and inconsistent-control measurements separate. */
  cohort: IAutoMovieRecoveryCameraPairInput["cohort"];

  /** Exactly three unique identities; indices zero and one are the seed. Keep all borrowed RGB bytes unchanged until synchronous return. */
  views: IAutoMovieRecoveryCameraView[];

  /** Unchanged feature, matching and two-view qualification operating point. */
  seedPolicy: IAutoMovieRecoveryCameraPolicy;

  /** Existing pair limits: maxPixels covers the seed pair; candidate/features limits apply per image and descriptor pairs per pair. */
  seedBudget: IAutoMovieRecoveryCameraBudget;

  /** Explicit per-point and 3D-to-2D reprojection operating point. */
  policy: IAutoMovieRecoveryCameraMapPolicy;

  /** Aggregate map and new numerical work limits. */
  budget: IAutoMovieRecoveryCameraMapBudget;
}
