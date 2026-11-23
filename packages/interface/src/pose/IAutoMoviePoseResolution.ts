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
 * current rest, parent and articulation it is given and returns a fresh result;
 * only pure basis work on the same admitted axes is shared between calls.
 * Immutable prepared rigs use the reader's identity to scope their own
 * dependency rows. A caller releases the reader when its evaluation ends; the
 * engine's provenance check (`preparePoseResolution.isNative`) decides whether
 * a supplied reader is a genuine one, so a structural copy is read as foreign.
 */
export interface IAutoMoviePoseResolution {
  /**
   * Read a clinical joint on the given axes and rest frame and return its fresh
   * bone-local rotation.
   *
   * @param joint The clinical joint, degrees or null per axis.
   * @param axes The bone's clinical axes; absent, the default basis.
   * @param frame The bone's clinical rest frame; absent, rest-relative angles.
   * @returns A fresh unit quaternion.
   */
  joint(
    joint: IAutoMovieJointPose,
    axes: IAutoMovieJointAxes | undefined,
    frame: IAutoMovieRestFrame | undefined,
  ): IAutoMovieQuaternion;

  /**
   * Compose a bone's world frame from its rest, its parent's world frame and
   * its articulation.
   *
   * @param bone The rig bone, with its rest offset and rotation.
   * @param parentRotation The parent's world rotation.
   * @param parentPosition The parent's world position, model metres.
   * @param articulation The bone-local rotation `joint` returned.
   * @returns The bone's fresh resolved frame.
   */
  bone(
    bone: IAutoMovieBone,
    parentRotation: IAutoMovieQuaternion,
    parentPosition: IAutoMovieVector3,
    articulation: IAutoMovieQuaternion,
  ): IAutoMovieResolvedBone;
}

/** Companion types of {@link IAutoMoviePoseResolution}. */
export namespace IAutoMoviePoseResolution {
  /**
   * A reader lent directly, or a getter that creates or borrows one at its
   * first actual demand.
   */
  export type ISource =
    | IAutoMoviePoseResolution
    | (() => IAutoMoviePoseResolution);
}
