import type { IAutoMovieRecoveryCameraBudget } from "./IAutoMovieRecoveryCameraBudget";
import type { IAutoMovieRecoveryCameraMapBudget } from "./IAutoMovieRecoveryCameraMapBudget";
import type { IAutoMovieRecoveryCameraMapPolicy } from "./IAutoMovieRecoveryCameraMapPolicy";
import type { IAutoMovieRecoveryCameraPairInput } from "./IAutoMovieRecoveryCameraPairInput";
import type { IAutoMovieRecoveryCameraPolicy } from "./IAutoMovieRecoveryCameraPolicy";
import type { IAutoMovieRecoveryCameraView } from "./IAutoMovieRecoveryCameraView";

/**
 * Three fixed RGB8 views of one asserted rigid scene, each with supplied
 * corrected pinhole intrinsics. Views zero and one form the ordered seed; view
 * two is registered against points triangulated from that seed. Keep each
 * borrowed raster unchanged until the synchronous call returns.
 */
export interface IAutoMovieRecoveryCameraMapInput {
  /** Resident three-view camera-map schema. */
  schema: "automovie-recovery-camera-map-input-v1";

  /** Nonblank identity of the asserted common scene. */
  objectId: string;

  /** Caller assertion that the views observe a single fixed scene. */
  rigidity: IAutoMovieRecoveryCameraPairInput["rigidity"];

  /** Acquisition cohort retained in the output evidence. */
  cohort: IAutoMovieRecoveryCameraPairInput["cohort"];

  /**
   * Exactly three views with unique IDs and exact RGB8 populations. The first
   * two define the seed, and the third is the resection target.
   */
  views: IAutoMovieRecoveryCameraView[];

  /**
   * Operating point for feature extraction, appearance matching, and two-view
   * qualification.
   */
  seedPolicy: IAutoMovieRecoveryCameraPolicy;

  /**
   * Limits for seed-pair pixels, feature work per view, descriptor comparisons
   * per pair, and pair qualification.
   */
  seedBudget: IAutoMovieRecoveryCameraBudget;

  /**
   * Operating thresholds for seed-point geometry, third-view resection, and
   * joint pixel reprojection.
   */
  policy: IAutoMovieRecoveryCameraMapPolicy;

  /** Aggregate map limits and bounded work for resection and joint refinement. */
  budget: IAutoMovieRecoveryCameraMapBudget;
}
