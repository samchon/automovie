import { AutoMovieGravity, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWireFlight,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * An arrested fall on a wire (`IAutoMovieMotionHumanWireFlight.IArrest`). From
 * where it hangs raised, the body falls free for `drop` under standard gravity,
 * so it reaches `v = sqrt(2 g drop)`; the wire then takes it and decelerates it
 * uniformly to rest at the authored height, needing `a = v² / (2 d)` over the
 * remaining distance `d`; it hangs there for `HOLD`, then the wire lowers it to
 * the floor on a minimum-jerk profile, landing at rest. The body keeps the
 * posture it entered with. A fall whose deceleration would exceed the authored
 * bound, or which has no room left above the stop, is refused.
 */
export namespace wireArrest {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "wireArrest";

  /** Cancel table: none; the wire lowers the body to the floor. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** How long the body hangs still at the stop, seconds: authored. */
  export const HOLD: number = 0.4;

  /**
   * Plan an arrested fall.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `drop`, `stop` or `seconds` out of range, and on
   *   `deceleration` when the stop needs more than the bound.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWireFlight.IArrest>,
  ): IAutoMovieMotionHumanActionPlan {
    const params: IAutoMovieMotionHumanWireFlight.IArrest = context.params;
    const g: number = AutoMovieGravity.STANDARD;
    const bound: number = params.deceleration ?? 2 * g;
    const lower: number = params.duration ?? 1;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const top: number = entry.root.y;
    for (const [axis, value, ok] of [
      ["drop", params.drop, params.drop > 0],
      ["stop", params.stop, params.stop >= 0],
      ["duration", lower, lower > 0],
      ["deceleration", bound, bound > 0],
    ] as const)
      if (!ok)
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value,
          reason: `an arrested fall's ${axis} is a positive finite value`,
          fix: `give a positive ${axis}`,
        });
    const room: number = top - params.drop - params.stop;
    if (!(room > 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stop",
        value: params.stop,
        feasible: {
          kind: "range",
          unit: "m",
          minimum: 0,
          maximum: Math.max(0, top - params.drop),
        },
        reason: `the body hangs ${top.toFixed(2)} m up; after the ${params.drop.toFixed(2)} m drop no room is left above the stop`,
        fix: "drop less, stop lower, or raise the body first",
      });
    const speed: number = Math.sqrt(2 * g * params.drop);
    const needed: number = (speed * speed) / (2 * room);
    if (needed > bound)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "deceleration",
        value: needed,
        feasible: { kind: "range", unit: "m/s²", minimum: 0, maximum: bound },
        reason: `stopping at ${params.stop.toFixed(2)} m needs ${needed.toFixed(1)} m/s², beyond the wire's ${bound.toFixed(1)}`,
        fix: "drop less, stop lower, or allow a harder stop",
      });

    // The clock: the free fall, the braking, the hold and the lowering.
    const fall: number = speed / g;
    const brake: number = speed / needed;
    const caught: number = fall + brake;
    const held: number = caught + HOLD;
    const duration: number = held + lower;
    const height: (t: number) => number = (t: number): number => {
      if (t <= fall) return top - 0.5 * g * t * t;
      if (t <= caught) {
        const u: number = t - fall;
        return top - params.drop - (speed * u - 0.5 * needed * u * u);
      }
      if (t <= held) return params.stop;
      return params.stop * (1 - minimumJerk.share((t - held) / lower));
    };
    return {
      duration,
      events: [
        { name: "fall", share: 0 },
        { name: "caught", share: fall / duration },
        { name: "stopped", share: caught / duration },
        { name: "lowered", share: held / duration },
        { name: "land", share: 1 },
      ],
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 1,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 1,
          to: 1,
          support: { kind: "ground" },
        },
      ],
      physicalWindow: null,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        return {
          ...entry,
          root: { ...entry.root, y: height(t) },
        };
      },
    };
  }
}
