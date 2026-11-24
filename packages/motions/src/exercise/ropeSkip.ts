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

    // A slow cadence adds still support time. The cubic reaches maximum
    // compression one third of this interval from takeoff or landing.
    const compressionSeconds: number = Math.min(takeoff, 0.18);
    const times: readonly number[] = [
      0,
      takeoff - compressionSeconds / 3,
      takeoff,
      under - flight / 4,
      under,
      under + flight / 4,
      landed,
      landed + compressionSeconds / 3,
      duration,
    ];
    const takeoffShare: number = takeoff / duration;
    const underShare: number = under / duration;
    const landedShare: number = landed / duration;
    const shares: readonly number[] = times.map(
      (time: number): number => time / duration,
    );
    const filmTimes: readonly number[] = shares.map(
      (share: number): number => context.start + share * duration,
    );

    // The event reader reconstructs film time from the share. The pose
    // reader then subtracts the start to recover time within the action.
    if (
      !ordered(times) ||
      !ordered(shares) ||
      !ordered(filmTimes) ||
      !ordered(filmTimes.map((time: number): number => time - context.start))
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "periodSeconds",
        value: {
          periodSeconds: duration,
          flightSeconds: flight,
          start: context.start,
        },
        reason:
          "the skip phases need distinct times on the action and film clocks",
        fix: "use a period closer to the default or place the skip earlier",
      });

    const stance: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { hold: takeoff, sway: 0 } })
      .posture(takeoff);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...stance.joints };
    for (const side of SIDES) {
      joints[`${side}UpperArm`] = [0, 15, 0];
      joints[`${side}LowerArm`] = [80, 0, 0];
      Object.assign(joints, HumanHand.shape(side, "fist"));
    }

    const gravity: number = AutoMovieGravity.STANDARD;
    const launchSpeed: number = (gravity * flight) / 2;
    return {
      duration,
      events: [
        { name: "ropeOverhead", share: 0 },
        { name: "takeoff", share: takeoffShare },
        { name: "ropeUnder", share: underShare },
        { name: "landed", share: landedShare },
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

/** Check that every phase sample occupies a distinct finite clock instant. */
function ordered(times: readonly number[]): boolean {
  return times.every(
    (time: number, i: number): boolean =>
      Number.isFinite(time) && (i === 0 || times[i - 1]! < time),
  );
}
