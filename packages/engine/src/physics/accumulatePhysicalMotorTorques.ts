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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Map a Cartesian actuator demand through virtual work, tau=J^T wrench (Pratt et al., ICRA 1997)) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Map a Cartesian actuator demand through virtual work, tau=J^T wrench (Pratt et al., ICRA 1997)) directly over its typed inputs (`input`) as nested iteration of depth 2 (while loop; find over input.profile.joints; for-of over input.chain), delegating to `ancestors.add`, `ancestors.has`, `Quaternion.multiply`, `parent.rotation`, `Vector3.add`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 38 lines and 4 top-level statements that reuses `ancestors.add`, `ancestors.has`, `Quaternion.multiply`, `parent.rotation`, `Vector3.add` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (while loop; find over input.profile.joints; for-of over input.chain), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
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
