import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFrame,
  IAutoMovieQuaternion,
} from "@automovie/interface";

/**
 * Rigid frames of position and rotation, composed and taken relative: a
 * prop kept in a bone's frame while it rides the bone, a hand kept in the
 * chest's frame while the trunk carries it, a stuck arrow kept in the frame
 * of what it struck.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the two operations give and where they are used.
 * @evidence contracts/development/design.md#principled-representation The rigid transforms of SE(3) on the prop frame record: composition and the inverse applied on the left.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Composition, solving either factor and a bone's frame, read by flights, release and grasp demands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rotations are the engine's quaternions, renormalised after composition.
 */
export namespace HumanPropFrame {
  /**
   * A frame given in `parent`'s frame, in the world.
   *
   * @param parent The parent's world frame.
   * @param local The frame in the parent's frame.
   * @returns The world frame.
   */
  export function compose(
    parent: IAutoMovieMotionHumanProp.IFrame,
    local: IAutoMovieMotionHumanProp.IFrame,
  ): IAutoMovieMotionHumanProp.IFrame {
    return {
      position: Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, local.position),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(parent.rotation, local.rotation),
      ),
    };
  }

  /**
   * A world frame in `parent`'s frame: the inverse of {@link compose}.
   *
   * @param parent The parent's world frame.
   * @param world The world frame.
   * @returns The frame in the parent's frame.
   */
  export function relative(
    parent: IAutoMovieMotionHumanProp.IFrame,
    world: IAutoMovieMotionHumanProp.IFrame,
  ): IAutoMovieMotionHumanProp.IFrame {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(parent.rotation);
    return {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(world.position, parent.position),
      ),
      rotation: Quaternion.multiply(inverse, world.rotation),
    };
  }

  /**
   * The parent frame that places a local child frame at a world frame.
   *
   * @param world The child's destination in the world.
   * @param local The child's frame relative to its parent.
   * @returns The parent frame, solving parent times local equals world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two input frames and the equation solved.
   * @evidence contracts/development/implementation.md#principled-implementation Right multiplication by the inverse rigid transform: R = R_world R_local^-1 and p = p_world - R p_local.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation and one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Normalizes the composed rotation, as compose does.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by placing and presenting demands instead of repeating the inverse-offset calculation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function parent(
    world: IAutoMovieMotionHumanProp.IFrame,
    local: IAutoMovieMotionHumanProp.IFrame,
  ): IAutoMovieMotionHumanProp.IFrame {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(world.rotation, Quaternion.inverse(local.rotation)),
    );
    return {
      position: Vector3.subtract(
        world.position,
        Quaternion.rotateVector(rotation, local.position),
      ),
      rotation,
    };
  }

  /**
   * A resolved bone's world frame.
   *
   * @param bone The bone's world position and rotation.
   * @returns The frame.
   */
  export function bone(
    bone: IAutoMovieMotionHumanPropFrame.IBoneBone,
  ): IAutoMovieMotionHumanProp.IFrame {
    return { position: bone.worldPosition, rotation: bone.worldRotation };
  }
}
