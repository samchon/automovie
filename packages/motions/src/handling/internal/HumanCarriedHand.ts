import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { poseBones } from "../../posture/internal/poseBones";

/** The finger bones' names, as they follow a side in a joint's name. */
const DIGITS: RegExp = /(Thumb|Index|Middle|Ring|Little)/;

/**
 * A one-handed handling plan performed over a carrier: the hand's work of a
 * standing plan (a put down, a holstering, a sheathing) carried onto the body
 * the carrier keeps. The standing plan is planned as it is, on the entry's
 * body; over the carrier the action keeps the carrier's posture, claims only
 * the working arm and hand, drops the feet's plants, and writes the standing
 * plan's arm goal and fingers over it, the goal carried into the frame of the
 * bone the target rides on this body (a holster on the hips) at the entry, so
 * the hand follows the target as the body moves; a target in the world keeps
 * the world goal.
 */
export namespace HumanCarriedHand {
  /**
   * The standing plan carried over the carrier.
   *
   * @param plan The standing plan.
   * @param context The action's context, its carrier present.
   * @param side The working hand.
   * @param frame The bone the target rides on this body; none for a target in
   *   the world.
   * @returns The plan over the carrier.
   */
  export function over(
    plan: IAutoMovieMotionHumanActionPlan,
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    frame: AutoMovieHumanoidBone | undefined,
  ): IAutoMovieMotionHumanActionPlan {
    const limb: AutoMovieHumanLimb = `${side}Arm`;
    const at: IAutoMovieResolvedBone | undefined =
      frame === undefined
        ? undefined
        : poseBones(
            context.body,
            context.entry.pose,
            undefined,
            new Set<AutoMovieHumanoidBone>([frame]),
          ).get(frame);
    const inverse: IAutoMovieQuaternion =
      at === undefined
        ? Quaternion.identity()
        : Quaternion.inverse(at.worldRotation);
    const local: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      at === undefined
        ? p
        : Quaternion.rotateVector(
            inverse,
            Vector3.subtract(p, at.worldPosition),
          );
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, plan.duration);
    return {
      ...plan,
      contacts: [
        ...base.contacts,
        ...plan.contacts.filter(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.part !== "leftFoot" && c.part !== "rightFoot",
        ),
      ],
      channels: [limb, `${side}Hand`],
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const standing: IAutoMovieMotionHumanPosture = plan.posture(seconds);
        const carried: IAutoMovieMotionHumanPosture = base.posture(
          seconds,
          channels,
          resolution,
          projection,
        );
        const goal: IAutoMovieHumanLimbGoal | undefined = standing.limbs[limb];
        const digits: IAutoMovieMotionHumanPosture["joints"] = {};
        for (const [bone, angles] of Object.entries(standing.joints))
          if (bone.startsWith(side) && DIGITS.test(bone))
            digits[bone as keyof IAutoMovieMotionHumanPosture["joints"]] =
              angles;
        return {
          ...carried,
          joints: { ...carried.joints, ...digits },
          limbs: {
            ...carried.limbs,
            ...(goal === undefined
              ? {}
              : {
                  [limb]:
                    at === undefined || goal.on !== undefined
                      ? goal
                      : {
                          ...goal,
                          point: local(goal.point),
                          bend: local(goal.bend),
                          ...(goal.rotation === undefined
                            ? {}
                            : {
                                rotation: Quaternion.normalize(
                                  Quaternion.multiply(inverse, goal.rotation),
                                ),
                              }),
                          on: frame,
                        },
                }),
          },
        };
      },
    };
  }

  /**
   * The bone of this performer a target prop rides: worn on it, or mounted on a
   * prop worn on it; none for a prop in the world.
   *
   * @param context The action's context.
   * @param subject The target prop.
   * @returns The bone, or none.
   */
  export function riding(
    context: IAutoMovieMotionHumanActionContext<object>,
    subject: string,
  ): AutoMovieHumanoidBone | undefined {
    const prop: IAutoMovieMotionHumanProp = context.prop(subject).prop;
    const worn: IAutoMovieMotionHumanProp["worn"] =
      prop.worn ??
      (prop.mounted === undefined
        ? undefined
        : context.prop(prop.mounted.prop).prop.worn);
    return worn !== undefined && worn.subject === context.subject
      ? worn.bone
      : undefined;
  }
}
