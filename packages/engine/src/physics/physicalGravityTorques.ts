import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Counter actual downstream gravitational moments through the same bounded joint motors.
 * Joints arrive in postorder, so one mass/first-moment accumulation includes
 * every attachment in linear work. This is feed-forward actuator demand, not
 * an additional unbounded force or a change to any physical mass or gravity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Counter actual downstream gravitational moments through the same bounded joint motors) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Counter actual downstream gravitational moments through the same bounded joint motors) directly over its typed inputs (`profile`, `order`, `segments`, `gravity`) as nested iteration of depth 2 (map over profile.segments; for-of over order; find over profile.segments), delegating to `Vector3.scale`, `segments.get`, `loads.get`, `Vector3.add`, `child.translation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 70 lines and 7 top-level statements that reuses `Vector3.scale`, `segments.get`, `loads.get`, `Vector3.add`, `child.translation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 8 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profile`, `order`, `segments`, `gravity`; the dominant cost is nested iteration of depth 2 (map over profile.segments; for-of over order; find over profile.segments), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalGravityTorques(
  profile: P,
  order: readonly P.IJoint[],
  segments: ReadonlyMap<string, RigidBody>,
  gravity: IAutoMovieVector3,
): { joints: Map<string, IAutoMovieVector3>; root: IAutoMovieVector3 } {
  const loads: Map<string, { mass: number; moment: IAutoMovieVector3 }> =
    new Map(
      profile.segments.map(
        (
          segment: (typeof profile.segments)[number],
        ): [string, { mass: number; moment: IAutoMovieVector3 }] => [
          segment.bone,
          {
            mass: segment.mass,
            moment: Vector3.scale(
              segments.get(segment.bone)!.worldCom(),
              segment.mass,
            ),
          },
        ],
      ),
    );
  const result: Map<string, IAutoMovieVector3> = new Map();
  for (const joint of order) {
    const child: RigidBody = segments.get(joint.child)!;
    const parent: RigidBody = segments.get(joint.parent)!;
    const load: { mass: number; moment: IAutoMovieVector3 } = loads.get(
      joint.child,
    )!;
    const point: IAutoMovieVector3 = Vector3.add(
      child.translation(),
      Quaternion.rotateVector(child.rotation(), joint.childFrame.position),
    );
    const torque: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(
        Vector3.subtract(load.moment, Vector3.scale(point, load.mass)),
        gravity,
      ),
      -1,
    );
    result.set(
      joint.id,
      Quaternion.rotateVector(
        Quaternion.inverse(
          Quaternion.multiply(parent.rotation(), joint.parentFrame.rotation),
        ),
        torque,
      ),
    );
    const ancestor: { mass: number; moment: IAutoMovieVector3 } = loads.get(
      joint.parent,
    )!;
    ancestor.mass += load.mass;
    ancestor.moment = Vector3.add(ancestor.moment, load.moment);
  }
  const root: P.ISegment = profile.segments.find(
    (segment: (typeof profile.segments)[number]): boolean =>
      !profile.joints.some(
        (joint: (typeof profile.joints)[number]): boolean =>
          joint.child === segment.bone,
      ),
  )!;
  const load: { mass: number; moment: IAutoMovieVector3 } = loads.get(
    root.bone,
  )!;
  const moment: IAutoMovieVector3 = Vector3.subtract(
    load.moment,
    Vector3.scale(segments.get(root.bone)!.worldCom(), load.mass),
  );
  return {
    joints: result,
    root: Vector3.scale(Vector3.cross(moment, gravity), -1),
  };
}
