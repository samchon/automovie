import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieJointPose } from "./IAutoMovieJointPose";

/**
 * A single static full-body pose: a snapshot of the skeleton's articulation at one instant.
 *
 * A pose is sparse: joints lists overrides, and unlisted bones retain rest articulation. validatePose checks the pose against a target rig when invoked; direct kinematics resolution assumes caller admission rather than running that validator itself.
 *
 * A pose is also the building block of motion: a {@link IAutoMovieKeyframe} is a pose plus a timestamp.
 *
 * @evidence contracts/common.md#principled-implementation validatePose checks rig identity, root transform scalars, declared joint membership, duplicates and each available effective ROM constraint. resolvePose composes sparse articulation over reachable rest hierarchy with root translation/rotation; it does not apply root or rest scale.
 * @evidence contracts/common.md#clear-and-simple-design Skeleton identity, optional root placement and sparse joint angles separate rig selection, whole-body movement and articulation, and the same record is reused by static staging and timed keyframes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unlisted bones use rest articulation. validatePose reports duplicate declared bones, while direct ungated resolvePose keeps the last joint and omits unreachable bones; this type does not make those low-level conventions disappear or certify a complete rendered pose.
 * @evidence contracts/common.md#meaningful-documentation States sparse rest behavior, target-rig validation, parent-space root placement and null identity, plus the single-entry rule for each articulated bone.
 * @author Samchon
 */
export interface IAutoMoviePose {
  /**
   * Which skeleton this pose articulates. The engine validates each joint against this rig's bones and ROM constraints.
   */
  skeleton: string;

  /**
   * Root placement of the whole character in its parent space. `null` = leave the root where it is (identity). Use this to plant, translate, or turn the whole body; per-joint bending is `joints`.
   */
  root: IAutoMovieTransform | null;

  /**
   * Sparse articulation overrides; neutral bones may be omitted. Each IAutoMovieJointPose.bone should appear at most once: validatePose reports duplicates, while direct ungated resolvePose uses the last entry.
   */
  joints: IAutoMovieJointPose[];
}
