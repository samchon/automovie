import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";

/**
 * A single static full-body pose: a snapshot of the skeleton's articulation at
 * one instant.
 *
 * A pose is sparse: joints lists overrides, and unlisted bones retain rest
 * articulation. validatePose checks the pose against a target rig when invoked;
 * direct kinematics resolution assumes caller admission rather than running
 * that validator itself.
 *
 * A pose is also the building block of motion: a {@link IAutoMovieKeyframe} is a
 * pose plus a timestamp.
 */
export interface IAutoMoviePose {
  /**
   * Which skeleton this pose articulates. The engine validates each joint
   * against this rig's bones and ROM constraints.
   */
  skeleton: string;

  /**
   * Root placement of the whole character in its parent space. `null` = leave
   * the root where it is (identity). Use this to plant, translate, or turn the
   * whole body; per-joint bending is `joints`.
   */
  root: IAutoMovieTransform | null;

  /**
   * Sparse articulation overrides; neutral bones may be omitted. Each
   * IAutoMovieJointPose.bone should appear at most once: validatePose reports
   * duplicates, while direct ungated resolvePose uses the last entry.
   */
  joints: IAutoMovieJointPose[];
}
