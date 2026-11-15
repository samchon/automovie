import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanProp } from "./IHumanProp";

/**
 * Rigid frames of position and rotation, composed and taken relative: a
 * prop kept in a bone's frame while it rides the bone, a hand kept in the
 * chest's frame while the trunk carries it, a stuck arrow kept in the frame
 * of what it struck.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the two operations give and where they are used.
 * @evidence contracts/development/design.md#principled-representation The rigid transforms of SE(3) on the prop frame record: composition and the inverse applied on the left.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions and a bone's frame, read by the flights and the release.
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
    parent: IHumanProp.IFrame,
    local: IHumanProp.IFrame,
  ): IHumanProp.IFrame {
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
    parent: IHumanProp.IFrame,
    world: IHumanProp.IFrame,
  ): IHumanProp.IFrame {
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
   * A resolved bone's world frame.
   *
   * @param bone The bone's world position and rotation.
   * @returns The frame.
   */
  export function bone(bone: {
    worldPosition: IAutoMovieVector3;
    worldRotation: IAutoMovieQuaternion;
  }): IHumanProp.IFrame {
    return { position: bone.worldPosition, rotation: bone.worldRotation };
  }
}
