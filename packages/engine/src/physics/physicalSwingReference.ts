import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * A swinging limb's references near its lift-off: each of its chain's joints
 * drawn by a share from the relative rotation it actually stands at toward the
 * one fit to the swing's path, and the chain recomposed outward from its
 * parent's reference, so at share zero every joint's reference is its actual
 * angle and the swing's references are continuous at lift. A swing task's
 * reference starts at the foot's present placement when its contact is removed
 * (TSID, `remove_contact`), and a contact change is ramped rather than switched
 * (Kim, Jorgensen and Sentis 2018).
 *
 * @param input The chain's joints, proximal first; the reference pose of the
 *   first joint's parent, world; the chain's and that parent's actual poses
 *   and fitted poses, world; and the share in [0, 1].
 * @returns The chain's reference poses, world.
 */
export function physicalSwingReference(input: {
  joints: readonly IAutoMoviePhysicalJoint[];
  base: IAutoMovieRigidTransform;
  actual: Readonly<Record<string, IAutoMovieRigidTransform>>;
  fit: Readonly<Record<string, IAutoMovieRigidTransform>>;
  share: number;
}): Record<string, IAutoMovieRigidTransform> {
  const share: number = Math.max(0, Math.min(1, input.share));
  const out: Record<string, IAutoMovieRigidTransform> = Object.create(null);
  const relative = (
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    joint: IAutoMoviePhysicalJoint,
  ): IAutoMovieQuaternion =>
    Quaternion.multiply(
      Quaternion.inverse(
        Quaternion.multiply(
          poses[joint.parent]!.rotation,
          joint.parentFrame.rotation,
        ),
      ),
      Quaternion.multiply(
        poses[joint.child]!.rotation,
        joint.childFrame.rotation,
      ),
    );
  for (const joint of input.joints) {
    const parent: IAutoMovieRigidTransform =
      out[joint.parent] ?? input.base;
    const turn: IAutoMovieQuaternion = Quaternion.slerp(
      relative(input.actual, joint),
      relative(input.fit, joint),
      share,
    );
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.multiply(
          Quaternion.multiply(parent.rotation, joint.parentFrame.rotation),
          turn,
        ),
        Quaternion.inverse(joint.childFrame.rotation),
      ),
    );
    const pivot: IAutoMovieVector3 = Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
    );
    out[joint.child] = {
      position: Vector3.subtract(
        pivot,
        Quaternion.rotateVector(rotation, joint.childFrame.position),
      ),
      rotation,
    };
  }
  return out;
}
