import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "../audit/AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as Model } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { HumanAuditModel } from "../posture/HumanAuditModel";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The first instant of a sit's lowering at which a hanging hand meets its
 * rising thigh: the body lowered as the sit lowers it, the arm held as the
 * action was entered (the arm a hand hangs by until its reach), and the tangle
 * audit's own reading of the hand-and-digit segments against the thigh's
 * (`AutoMovieMotionHumanAuditTangleMargin.own`, both ways): the hand meets the
 * thigh where a probe of either first lies deeper in the other than its
 * reference depth by more than the admission allows (`HumanAuditModel
 * .ALLOWANCE`, the depth the planner's pairs and the audit admit), so a hand
 * that rests against its thigh as the body stands is not met by it. A seated
 * person's hands land on the thighs as the thighs come up under them, so a sit
 * opens a hand's rest there rather than hanging it inside the thigh. Read at
 * the plan's frame grid (`AutoMovieMotionHumanArmCourse.STEP`), the resolution
 * every course of the plan is read at, from the plan's start, and at the last
 * second asked.
 *
 * @param props The body, the lowering, the entry, the side and the last second.
 * @returns The first such second at which the hand meets the thigh; none where
 *   it does not by the last second.
 */
export function sitHandMeet(props: sitHandMeet.IProps): number | undefined {
  const { body, side }: sitHandMeet.IProps = props;
  const model: IAutoMovieMotionHumanAuditTangleModel.IModel = body.tangle;
  const hand: string = `${side}Hand`;
  const thigh: AutoMovieHumanoidBone = `${side}UpperLeg`;
  const hands: number[] = [];
  let leg: number = -1;
  model.parts.forEach(
    (part: IAutoMovieMotionHumanAuditTangleModel.IPart, i: number): void => {
      if (Model.group(part.bone) === hand) hands.push(i);
      if (part.bone === thigh) leg = i;
    },
  );
  if (hands.length === 0 || leg < 0) return undefined;

  // The arm as it was entered: its shoulder, upper and lower arm, hand and
  // digits at their entry angles; no arm goal.
  const arm: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const joint of props.entry.joints)
    if (
      joint.bone.startsWith(side) &&
      (Model.group(joint.bone) === hand ||
        joint.bone === `${side}Shoulder` ||
        joint.bone === `${side}UpperArm` ||
        joint.bone === `${side}LowerArm`)
    )
      arm[joint.bone] = angles(joint);
  const meets = (seconds: number): boolean => {
    const posture: IAutoMovieMotionHumanPosture = props.posture(seconds);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    const pose: IAutoMoviePose = resolveHumanPosture(body, {
      ...posture,
      joints: { ...posture.joints, ...arm },
      limbs,
    });
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return hands.some(
      (h: number): boolean =>
        Margin.own(model, placed, h, leg, []).excess >
          HumanAuditModel.ALLOWANCE ||
        Margin.own(model, placed, leg, h, []).excess >
          HumanAuditModel.ALLOWANCE,
    );
  };

  // Every grid instant before the last second, then the last second itself.
  const step: number = AutoMovieMotionHumanArmCourse.STEP;
  for (let k: number = 0; k * step < props.until; ++k)
    if (meets(k * step)) return k * step;
  return meets(props.until) ? props.until : undefined;
}

/** The companion types of a hand's meeting with its thigh (`sitHandMeet`). */
export namespace sitHandMeet {
  /** What a hand's meeting with its thigh is read from. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The sit's posture at a second since its start, its legs, root and trunk
     * as it lowers them; its arm goal on the side read is not read.
     */
    posture(seconds: number): IAutoMovieMotionHumanPosture;

    /** The displayed pose the sit is entered with, whose arm hangs. */
    entry: IAutoMoviePose;

    /** The hand's side. */
    side: AutoMovieHumanSide;

    /** The last second read, from the sit's start. */
    until: number;
  }
}

/** A joint record's clinical angles, an unset angle as zero. */
function angles(joint: IAutoMovieJointPose): readonly [number, number, number] {
  return [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
}
