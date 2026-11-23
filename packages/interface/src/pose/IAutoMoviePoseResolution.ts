import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieBone } from "../skeleton/IAutoMovieBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

/**
 * The raw ordered forward-kinematics operations one synchronous motion
 * evaluation shares, as `preparePoseResolution` returns them.
 *
 * Each call reads the current clinical joint, axes and rest frame or the
 * current rest, parent and articulation it is given and returns a fresh
 * result; only pure basis work on the same admitted axes is shared between
 * calls. Immutable prepared rigs use the reader's identity to scope their own
 * dependency rows. A caller releases the reader when its evaluation ends; the
 * engine's provenance check (`preparePoseResolution.isNative`) decides whether
 * a supplied reader is a genuine one, so a structural copy is read as foreign.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each operation reads and returns, the one synchronous evaluation it lives for, and that genuineness is the engine's runtime check, not this shape.
 * @evidence contracts/development/design.md#principled-representation Two operations, one per forward-kinematics step (a clinical joint to a bone-local rotation, a bone's rest and parent to its world frame), over the canonical joint, axes, rest-frame and resolved-bone contracts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `preparePoseResolution` produces it; `prepareSkeletonPoseResolution`, the motions pose-resolution loans and the action plans' posture readers borrow it, so its shape is the one contract they share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No cached pose, target answer or validity flag is part of the shape; a structural stand-in is refused at run time by the engine's provenance check.
 */
export interface IAutoMoviePoseResolution {
  /**
   * Read a clinical joint on the given axes and rest frame and return its fresh bone-local rotation.
   *
   * @param joint The clinical joint, degrees or null per axis.
   * @param axes The bone's clinical axes; absent, the default basis.
   * @param frame The bone's clinical rest frame; absent, rest-relative angles.
   * @returns A fresh unit quaternion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the joint's degree/null coordinates, the absent axes and frame cases and the fresh unit result.
   */
  joint(
    joint: IAutoMovieJointPose,
    axes: IAutoMovieJointAxes | undefined,
    frame: IAutoMovieRestFrame | undefined,
  ): IAutoMovieQuaternion;

  /**
   * Compose a bone's world frame from its rest, its parent's world frame and its articulation.
   *
   * @param bone The rig bone, with its rest offset and rotation.
   * @param parentRotation The parent's world rotation.
   * @param parentPosition The parent's world position, model metres.
   * @param articulation The bone-local rotation `joint` returned.
   * @returns The bone's fresh resolved frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's frame and unit and the fresh resolved result.
   */
  bone(
    bone: IAutoMovieBone,
    parentRotation: IAutoMovieQuaternion,
    parentPosition: IAutoMovieVector3,
    articulation: IAutoMovieQuaternion,
  ): IAutoMovieResolvedBone;
}

/**
 * Companion types of {@link IAutoMoviePoseResolution}.
 */
export namespace IAutoMoviePoseResolution {
  /**
   * A reader lent directly, or a getter that creates or borrows one at its first actual demand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the loan forms a borrower accepts.
   * @evidence contracts/development/design.md#principled-representation A reader is lent directly or through a lazy getter that creates it at the first actual demand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The action plans' and carriers' posture readers and the motions pose-resolution loans accept exactly these two forms.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The union names the two real forms; an absent loan stays the optional parameter's own absence.
   */
  export type ISource =
    | IAutoMoviePoseResolution
    | (() => IAutoMoviePoseResolution);
}
