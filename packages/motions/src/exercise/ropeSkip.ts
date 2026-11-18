import { AutoMovieGravity, Vector3 } from "@automovie/engine";
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

import { stand } from "../actions/stand";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the supported motion, default timing derivation, and registration path.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the entry stance, phases and airborne translation.
   * @evidence contracts/development/implementation.md#principled-implementation A gravity parabola determines both-foot flight. A pair of mirrored Hermite ground paths matches vertical launch and landing speeds with fixed foot goals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the entry and times, prepare one stance and grip, then evaluate the phase and two foot goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the engine gravity and the stand planner's placements and emits separate support windows; phase markers do not claim a simulated cord.
   * @evidence contracts/development/implementation.md#efficient-algorithms One stand evaluation at plan time and constant work per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The planned ground stance and grip angles serve every sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its small stance and timing records; it opens no resources or time-indexed cache.
   */
  plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRopeSkip.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const flight: number = HumanBound.within(
      "flightSeconds",
      context.params.flightSeconds ?? 0.26,
      0.12,
      0.36,
      "s",
    );
    const duration: number = HumanBound.above(
      "periodSeconds",
      context.params.periodSeconds ?? 1 / 1.7,
      flight,
      "s",
    );
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

    const takeoff: number = (duration - flight) / 2;
    const under: number = takeoff + flight / 2;
    const landed: number = takeoff + flight;
    const stance: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { seconds: takeoff, sway: 0 } })
      .posture(takeoff);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...stance.joints };
    for (const side of SIDES) {
      joints[`${side}UpperArm`] = [0, 15, 0];
      joints[`${side}LowerArm`] = [80, 0, 0];
      Object.assign(joints, HumanHand.shape(side, "fist"));
    }

    const gravity: number = AutoMovieGravity.STANDARD;
    const launchSpeed: number = (gravity * flight) / 2;
    // Limit the duration of the crouch so a slow cadence adds still support time.
    const compressionSeconds: number = Math.min(takeoff, 0.18);
    return {
      duration,
      events: [
        { name: "ropeOverhead", share: 0 },
        { name: "takeoff", share: takeoff / duration },
        { name: "ropeUnder", share: under / duration },
        { name: "landed", share: landed / duration },
      ],
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
            to: takeoff / duration,
          },
          {
            part: `${side}Foot`,
            kind: "plant",
            support: { kind: "ground" },
            from: landed / duration,
            to: 1,
          },
        ],
      ),
      posture(seconds: number): IAutoMovieMotionHumanPosture {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const airborne: boolean = t > takeoff && t < landed;
        const airTime: number = t - takeoff;
        // The negative cubic has launch speed at takeoff and zero speed when
        // upright. Reading it in reverse gives the matching landing absorption.
        const groundShare: number = Math.min(
          1,
          (t <= takeoff ? takeoff - t : t - landed) / compressionSeconds,
        );
        const lift: number = airborne
          ? (gravity * airTime * (flight - airTime)) / 2
          : -launchSpeed *
            compressionSeconds *
            groundShare *
            (1 - groundShare) ** 2;
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
