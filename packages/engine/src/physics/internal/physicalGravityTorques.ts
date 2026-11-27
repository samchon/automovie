import type {
  IAutoMoviePhysicalGravityTorques,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";

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
  segments: ReadonlyMap<string, AutoMovieEngineXpbdBody>,
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
            moment: AutoMovieEngineVector3.scale(
              segments.get(segment.bone)!.worldCom(),
              segment.mass,
            ),
          },
        ],
      ),
    );
  const result: Map<string, IAutoMovieVector3> = new Map();
  for (const joint of order) {
    const child: AutoMovieEngineXpbdBody = segments.get(joint.child)!;
    const parent: AutoMovieEngineXpbdBody = segments.get(joint.parent)!;
    const load: { mass: number; moment: IAutoMovieVector3 } = loads.get(
      joint.child,
    )!;
    const point: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      child.translation(),
      AutoMovieEngineQuaternion.rotateVector(child.rotation(), joint.childFrame.position),
    );
    const torque: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.cross(
        AutoMovieEngineVector3.subtract(load.moment, AutoMovieEngineVector3.scale(point, load.mass)),
        gravity,
      ),
      -1,
    );
    result.set(
      joint.id,
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(
          AutoMovieEngineQuaternion.multiply(parent.rotation(), joint.parentFrame.rotation),
        ),
        torque,
      ),
    );
    const ancestor: { mass: number; moment: IAutoMovieVector3 } = loads.get(
      joint.parent,
    )!;
    ancestor.mass += load.mass;
    ancestor.moment = AutoMovieEngineVector3.add(ancestor.moment, load.moment);
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
  const moment: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    load.moment,
    AutoMovieEngineVector3.scale(segments.get(root.bone)!.worldCom(), load.mass),
  );
  return {
    joints: result,
    root: AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(moment, gravity), -1),
  };
}
