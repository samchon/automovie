import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * Inputs of `readHumanBodyResolvedClinicalPose`.
 *
 * The rig and the resolved bones are the same pose resolution's shaped rest frames and final frames after the pelvis turn; the authored rows and the pelvifemoral tilt are what that resolution consumed. Every input is read only.
 *
 * @evidence contracts/common.md#principled-implementation Matching shaped rest rig and final resolved frames accompany their consumed pose rows and pelvic tilt for inverse clinical-coordinate reading.
 * @evidence contracts/common.md#clear-and-simple-design One internal context keeps final-frame provenance explicit and separately requests full actual-frame inversion when source articulation requires it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored-coordinate/sagittal shortcuts apply only under their legacy resolver premises; independent source articulation requires actualFrames inversion.
 * @evidence contracts/common.md#meaningful-documentation Members state pre/post-pelvis frame roles, compiled neutrals/signs, degree tilt and actualFrames omission semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Clinical-pose input typing performs no inverse rotation or sagittal composition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Matching frame dependencies are described without caching clinical readings across pose evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed clinical-readback inputs acquire no inverse workspace or persistent pose task.
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
   * Read every actual frame through the engine inverse when a source graph can add independent articulation. Omission retains the legacy resolver's exact authored-coordinate and proved sagittal composition shortcuts.
   */
  actualFrames?: true;
}
