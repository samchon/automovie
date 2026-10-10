import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * Inputs of `readHumanBodyResolvedClinicalPose`.
 *
 * The rig and the resolved bones are the same pose resolution's shaped rest
 * frames and final frames after the pelvis turn; the authored rows and the
 * pelvifemoral tilt are what that resolution consumed. Every input is read
 * only.
 *
 * @author Samchon
 */
export interface IHumanBodyResolvedClinicalPoseInput {
  /** Shaped rig of the pose: skeleton, rest frames and clinical axes. */
  rig: IAutoMovieHumanBodySkeletonRig;

  /** Final resolved bones after the shoulder resolution and pelvis turn. */
  resolved: readonly IAutoMovieResolvedBone[];

  /** Compiled basis whose joints declare neutrals, signs and flexion landmarks. */
  basis: IAutoMovieHumanBodyBasis;

  /** Authored joint rows the resolution consumed. */
  pose: readonly IAutoMovieJointPose[];

  /** Posterior pelvifemoral tilt the pelvis turn applied, in degrees; zero for none. */
  tilt: number;

  /**
   * Read every actual frame through the engine inverse when a source graph
   * can add independent articulation. Omission retains the legacy resolver's
   * exact authored-coordinate and proved sagittal composition shortcuts.
   */
  actualFrames?: true;
}
