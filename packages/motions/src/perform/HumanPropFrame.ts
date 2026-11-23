import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPropFrame,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

/**
 * Rigid frames of position and rotation, composed and taken relative: a prop
 * kept in a bone's frame while it rides the bone, a hand kept in the chest's
 * frame while the trunk carries it, a stuck arrow kept in the frame of what it
 * struck.
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
    parent: IAutoMovieRigidTransform,
    local: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
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
    parent: IAutoMovieRigidTransform,
    world: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
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
   */
  export function parent(
    world: IAutoMovieRigidTransform,
    local: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
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
  ): IAutoMovieRigidTransform {
    return { position: bone.worldPosition, rotation: bone.worldRotation };
  }
}
