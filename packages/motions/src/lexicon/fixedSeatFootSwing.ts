import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

type PostureAtAngle = (degrees: number) => IAutoMovieMotionHumanPosture;
type OptionalAngle = number | undefined;
type OptionalGoal = IAutoMovieHumanLimbGoal | undefined;
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * A tilt between neutral and the request with both original floor contacts. The
 * caller fixes the bearing before asking for the range. Angular resolution is
 * the rig's own; each trial solves only the two legs, and checks the actual
 * ankle and the sole point carried by the actual foot rotation.
 */
export function fixedSeatFootSwing(
  body: IAutoMovieMotionHumanBody,
  at: PostureAtAngle,
  requested: number,
): OptionalAngle {
  const neutral: IAutoMovieMotionHumanPosture = at(0);
  for (const side of SIDES) {
    const goal: OptionalGoal = neutral.limbs[`${side}Leg`];
    if (
      !goal?.planted ||
      goal.on !== undefined ||
      !goal.contact ||
      !goal.rotation
    )
      return undefined;
  }
  const read: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    HumanBoneGroups.FEET,
  );
  const leg: number = body.measure.thigh + body.measure.shank;
  const supported = (degrees: number): boolean => {
    const posture: IAutoMovieMotionHumanPosture = at(degrees);
    const legs: IAutoMovieMotionHumanPosture = {
      ...posture,
      limbs: {
        leftLeg: posture.limbs.leftLeg,
        rightLeg: posture.limbs.rightLeg,
      },
    };
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read(
      resolveHumanPosture(body, legs),
    );
    for (const side of SIDES) {
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const goal: IAutoMovieHumanLimbGoal = legs.limbs[`${side}Leg`]!;
      const ankle: IAutoMovieVector3 = Vector3.subtract(
        foot.worldPosition,
        goal.point,
      );
      const sole: IAutoMovieVector3 = Vector3.add(
        ankle,
        Vector3.subtract(
          Quaternion.rotateVector(foot.worldRotation, goal.contact!),
          Quaternion.rotateVector(goal.rotation!, goal.contact!),
        ),
      );
      // A legal angle differing by the rig's own resolution can move an
      // ankle/sole by at most this arc. World coordinates alone cannot
      // bound the roundoff accumulated through bilateral FK.
      const precision: number =
        (leg + Vector3.length(goal.contact!)) *
        ROM_TOLERANCE *
        Quaternion.DEG2RAD;
      if (Vector3.length(ankle) > precision || Vector3.length(sole) > precision)
        return false;
    }
    return true;
  };
  if (!supported(0)) return undefined;
  if (supported(requested)) return requested;
  let near: number = 0;
  let far: number = requested;
  while (Math.abs(far - near) > ROM_TOLERANCE) {
    const trial: number = (near + far) / 2;
    if (supported(trial)) near = trial;
    else far = trial;
  }
  return near;
}
