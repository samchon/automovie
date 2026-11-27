import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRopeSkip,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanSupportFrame } from "../../carrier/HumanSupportFrame";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/HumanHand";
import { ropeSkipHop } from "./ropeSkipHop";

/** The two sides that share each support and flight phase. */
const SIDES = ["left", "right"] as const;

/**
 * One low two-foot hop in place, designed to accompany a single rope turn.
 * Register with `HumanChain.extend({ ropeSkip })` and the performance's laws.
 *
 * The default cadence is 1.7 Hz, a frequency tested by Silva and Pellegrini
 * (2009). They measured 0.13 s from takeoff to the simultaneous-foot rope
 * crossing. The model places that crossing at the apex, giving 0.26 s flight.
 * The flight band and the flat-foot compression and handle pose are authored
 * choices for a low hop. The arm and fist angles stage the grip, and the
 * action's named instants let a prop producer author its own rope turn.
 * https://periodicos.ufsc.br/index.php/rbcdh/article/download/1980-0037.2009v11n4p379/10901
 */
export const ropeSkip = {
  name: "ropeSkip",
  interrupts: {
    stand: [{ window: [1, 1], kind: "inertialize", entry: 0 }],
    ropeSkip: [{ window: [1, 1], kind: "inertialize", entry: 0 }],
  },

  /**
   * Plan one bipedal support, flight, and recovery cycle using the entry's
   * ground stance. Both ankle goals and the root translate together in flight.
   */
  plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRopeSkip.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const hop: ropeSkipHop.IHop = ropeSkipHop(context.params, context.start);
    const { duration, takeoff, landed, under } = hop;
    if (
      context.entry.base.kind !== "standing" ||
      SIDES.some(
        (side: (typeof SIDES)[number]): boolean =>
          !context.entry.feet[side].planted ||
          HumanSupportFrame.contact(context, `${side}Foot`).kind !== "ground",
      )
    )
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: context.entry.base.kind,
        reason:
          "a two-foot rope hop starts with both feet planted on the ground",
        fix: "enter the hop from a two-foot ground stand",
      });
    if (
      SIDES.some(
        (side: (typeof SIDES)[number]): boolean =>
          context.entry.holds[side] !== undefined,
      )
    )
      throw new HumanRefusal({
        kind: "channel",
        axis: "hands",
        value: context.entry.holds,
        reason: "the authored handle pose claims both hands",
        fix: "put down the held prop before entering the hop",
      });

    const takeoffShare: number = takeoff / duration;
    const landedShare: number = landed / duration;

    const stance: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { hold: takeoff, sway: 0 } })
      .posture(takeoff);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...stance.joints };
    for (const side of SIDES) {
      joints[`${side}UpperArm`] = [0, 15, 0];
      joints[`${side}LowerArm`] = [80, 0, 0];
      Object.assign(joints, HumanHand.shape(side, "fist"));
    }

    return {
      duration,
      events: hop.events,
      contact: under,
      contacts: SIDES.flatMap(
        (
          side: (typeof SIDES)[number],
        ): IAutoMovieMotionHumanContactWindow[] => [
          {
            part: `${side}Foot`,
            kind: "plant",
            support: { kind: "ground" },
            from: 0,
            to: takeoffShare,
          },
          {
            part: `${side}Foot`,
            kind: "plant",
            support: { kind: "ground" },
            from: landedShare,
            to: 1,
          },
        ],
      ),
      posture(seconds: number): IAutoMovieMotionHumanPosture {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const airborne: boolean = t > takeoff && t < landed;
        const lift: number = hop.lift(t);
        const offset: IAutoMovieVector3 = { x: 0, y: lift, z: 0 };
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...stance.limbs,
        };
        for (const side of SIDES) {
          const goal: IAutoMovieHumanLimbGoal = stance.limbs[`${side}Leg`]!;
          limbs[`${side}Leg`] = airborne
            ? {
                point: Vector3.add(goal.point, offset),
                bend: Vector3.add(goal.bend, offset),
                rotation: goal.rotation!,
              }
            : goal;
        }
        return {
          ...stance,
          root: Vector3.add(stance.root, offset),
          joints,
          limbs,
        };
      },
    };
  },
} satisfies IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanRopeSkip.IParams>;
