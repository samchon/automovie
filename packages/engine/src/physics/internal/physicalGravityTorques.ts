import type {
  IAutoMoviePhysicalGravityTorques,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";

/*
 * Counter actual downstream gravitational moments through the same bounded
 * joint motors. Joints arrive in postorder, so one mass/first-moment
 * accumulation includes every attachment in linear work. This is feed-forward
 * actuator demand, not an additional unbounded force or a change to any
 * physical mass or gravity.
 */
export function physicalGravityTorques(
  profile: IAutoMoviePhysicalProfile,
  order: readonly IAutoMoviePhysicalJoint[],
  segments: ReadonlyMap<string, AutoMovieXpbdBody>,
  gravity: IAutoMovieVector3,
): IAutoMoviePhysicalGravityTorques.IResult {
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
    const child: AutoMovieXpbdBody = segments.get(joint.child)!;
    const parent: AutoMovieXpbdBody = segments.get(joint.parent)!;
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
  const root: IAutoMoviePhysicalSegment = profile.segments.find(
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
