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

import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "../../audit/internal/AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as Model } from "../../audit/internal/AutoMovieMotionHumanAuditTangleModel";
import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { HumanAuditModel } from "../../posture/internal/HumanAuditModel";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
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
 * Parameter props: The body, the lowering, the entry, the side and the last second.
 * Returns: The first such second at which the hand meets the thigh; none where
 * it does not by the last second.
 */
export function sitHandMeet(props: sitHandMeet.IProps): number | undefined;

/*
 * Read the unbraced hands' first meetings during a sit's lower-body course.
 * The world foot goals place the thighs below the hips. Each entry arm is a
 * separate branch below the chest, so both hands observe the same thighs and
 * each sees its own entry angles when resolved in one pose. Neither an arm
 * nor a digit goal belongs to this lowering.
 * Parameter props: The sit's body, lowering, entry, unbraced sides and last second.
 * Returns: The first meeting second for each hand that meets its thigh.
 */
export function sitHandMeet(
  props: ILowering,
): Partial<Record<AutoMovieHumanSide, number>>;
export function sitHandMeet(
  props: sitHandMeet.IProps | ILowering,
): number | undefined | Partial<Record<AutoMovieHumanSide, number>> {
  if (props.side !== undefined) {
    const side: AutoMovieHumanSide = props.side;
    return firstMeets(
      {
        ...props,
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const posture: IAutoMovieMotionHumanPosture = props.posture(seconds);
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
          delete limbs[`${side}Arm`];
          return { ...posture, limbs };
        },
      },
      [side],
    )[side];
  }
  return firstMeets(
    {
      ...props,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const { root, yaw, pitch, roll, joints, rotation, limbs } =
          props.posture(seconds);
        return {
          root,
          yaw,
          pitch,
          roll,
          joints,
          ...(rotation === undefined ? {} : { rotation }),
          limbs: {
            ...(limbs.leftLeg === undefined ? {} : { leftLeg: limbs.leftLeg }),
            ...(limbs.rightLeg === undefined ? {} : { rightLeg: limbs.rightLeg }),
          },
        };
      },
    },
    props.sides,
  );
}

/*
 * Read the original grid once, checking each hand until its first meeting.
 */
function firstMeets(
  props: Omit<sitHandMeet.IProps, "side">,
  sides: Iterable<AutoMovieHumanSide>,
): Partial<Record<AutoMovieHumanSide, number>> {
  const { body, entry, until }: Omit<sitHandMeet.IProps, "side"> = props;
  const model: IAutoMovieMotionHumanAuditTangleModel.IModel = body.tangle;
  const arms: IAutoMovieMotionHumanPosture["joints"] = {};
  const pairs: IHand[] = [];
  for (const side of sides) {
    const hand: string = `${side}Hand`;
    const hands: number[] = [];
    let thigh: number = -1;
    model.parts.forEach(
      (part: IAutoMovieMotionHumanAuditTangleModel.IPart, i: number): void => {
        if (Model.group(part.bone) === hand) hands.push(i);
        if (part.bone === `${side}UpperLeg`) thigh = i;
      },
    );
    if (hands.length === 0 || thigh < 0) continue;
    pairs.push({ side, hands, thigh });

    // Hold the shoulder, arm, hand and digits at the entry angles.
    for (const joint of entry.joints)
      if (
        joint.bone.startsWith(side) &&
        (Model.group(joint.bone) === hand ||
          joint.bone === `${side}Shoulder` ||
          joint.bone === `${side}UpperArm` ||
          joint.bone === `${side}LowerArm`)
      )
        arms[joint.bone] = angles(joint);
  }
  const meets: Partial<Record<AutoMovieHumanSide, number>> = {};
  let remaining: number = pairs.length;
  const read = (seconds: number): void => {
    const posture: IAutoMovieMotionHumanPosture = props.posture(seconds);
    const pose: IAutoMoviePose = resolveHumanPosture(body, {
      ...posture,
      joints: { ...posture.joints, ...arms },
    });
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    for (const { side, hands, thigh } of pairs) {
      if (meets[side] !== undefined) continue;
      if (
        hands.some(
          (hand: number): boolean =>
            Margin.own(model, placed, hand, thigh, []).excess >
              HumanAuditModel.ALLOWANCE ||
            Margin.own(model, placed, thigh, hand, []).excess >
              HumanAuditModel.ALLOWANCE,
        )
      ) {
        meets[side] = seconds;
        --remaining;
      }
    }
  };

  // Every grid instant before the last second, then the last second itself.
  const step: number = AutoMovieMotionHumanArmCourse.STEP;
  for (let k: number = 0; remaining > 0 && k * step < until; ++k)
    read(k * step);
  if (remaining > 0) read(until);
  return meets;
}

/*
 * A joint record's clinical angles, an unset angle as zero.
 */
function angles(joint: IAutoMovieJointPose): readonly [number, number, number] {
  return [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
}

/*
 * The companion types of a hand's meeting with its thigh.
 */
export namespace sitHandMeet {
  /*
   * What a hand's meeting with its thigh is read from.
   */
  export interface IProps {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The sit's posture at a second since its start, its legs, root and trunk
     * as it lowers them; its arm goal on the side read is not read.
     */
    posture(seconds: number): IAutoMovieMotionHumanPosture;

    /*
     * The displayed pose the sit is entered with, whose arm hangs.
     */
    entry: IAutoMoviePose;

    /*
     * The hand's side.
     */
    side: AutoMovieHumanSide;

    /*
     * The last second read, from the sit's start.
     */
    until: number;
  }
}

/*
 * The lower-body course admits a set of independent unbraced hands.
 */
interface ILowering extends Omit<sitHandMeet.IProps, "side"> {
  /*
   * No single side is being read over an unrestricted posture.
   */
  side?: never;

  /*
   * The hands with no armrest, each read once.
   */
  sides: ReadonlySet<AutoMovieHumanSide>;
}

/*
 * The original ordered collider indices for one hand and its own thigh.
 */
interface IHand {
  /*
   * The side the pair belongs to.
   */
  side: AutoMovieHumanSide;

  /*
   * The hand and digit collider part indices, in body order.
   */
  hands: readonly number[];

  /*
   * The upper leg collider part index.
   */
  thigh: number;
}
