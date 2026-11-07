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
