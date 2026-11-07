import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Map a Cartesian actuator demand through virtual work, tau=J^T wrench
 * (Pratt et al., ICRA 1997). A point-force column is axis cross lever; reverse
 * traversal controls a proximal body relative to the support. Accumulate in
 * each actual parent joint frame. The existing implicit joint motors apply
 * these demands within their torque caps, rather than forcing tiny coordinate
 * carriers directly or adding external momentum to an unsupported assembly.
 */
export function accumulatePhysicalMotorTorques(input: {
  /** Admitted articulated geometry. */ profile: P;
  /** Current actual native segments. */ segments: ReadonlyMap<
    string,
    RigidBody
  >;
  /** Actuator path from proximal to distal. */ chain: readonly string[];
  /** Actual segment carrying the application point, independent of the support endpoint owner. */ carrier: string;
  /** World point controlled by the force. */ point: IAutoMovieVector3;
  /** Bounded Cartesian demand, newtons. */ force: IAutoMovieVector3;
  /** Bounded world moment at that point, N m. */ torque: IAutoMovieVector3;
  /** Control the proximal root relative to a distal support when true. */ reverse: boolean;
  /** Existing joint-frame feed-forward demands to accumulate. */ torques: Map<
    string,
    IAutoMovieVector3
  >;
}): void {
  const ancestors: Set<string> = new Set();
  let carrier: string | undefined = input.carrier;
  while (carrier) {
    ancestors.add(carrier);
    carrier = input.profile.joints.find(
      (joint: P.IJoint): boolean => joint.child === carrier,
    )?.parent;
  }
  for (const bone of input.chain) {
    if (!ancestors.has(bone)) continue;
    const joint: P.IJoint | undefined = input.profile.joints.find(
      (candidate: P.IJoint): boolean => candidate.child === bone,
    );
    if (!joint) continue;
    const parent: RigidBody = input.segments.get(joint.parent)!;
    const frame: P.ITransform["rotation"] = Quaternion.multiply(
      parent.rotation(),
      joint.parentFrame.rotation,
    );
    const pivot: IAutoMovieVector3 = Vector3.add(
      parent.translation(),
      Quaternion.rotateVector(parent.rotation(), joint.parentFrame.position),
    );
    const moment: IAutoMovieVector3 = Vector3.add(
      Vector3.cross(Vector3.subtract(input.point, pivot), input.force),
      input.torque,
    );
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(frame),
      Vector3.scale(moment, input.reverse ? -1 : 1),
    );
    input.torques.set(
      joint.id,
      Vector3.add(input.torques.get(joint.id) ?? { x: 0, y: 0, z: 0 }, local),
    );
  }
}
