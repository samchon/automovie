import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { FilmVector as Vec3 } from "../rig/FilmVector";

/**
 * Timing and limb paths of one attack, independent of who receives it.
 *
 * @evidence contracts/common.md#implementation-and-ownership A punch drives the glove from its live guard position to the resolved target with a fast-out ease, holds at contact for two frames and returns; hooks and uppercuts bend that path through a quadratic Bézier control point so the fist travels around or under the guard. A roundhouse lifts the knee to a chamber, sweeps the shin through the target along the swing direction, re-chambers and lands where the footstep schedule placed it. All functions are pure in film time.
 * @evidence contracts/common.md#authoring-interface World metres and film seconds. Callers supply the resolved target point and the attacker's live guard and hip positions; these functions never read the opponent.
 */
export namespace Strike {
  /**
   * Phase of an attack at one second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Phase snapshot of one action.
   * @evidence contracts/common.md#authoring-interface Seconds relative to contact; unit progress values.
   */
  export interface Envelope {
    /** Extension toward the target in [0, 1]. */
    extension: number;
    /** Seconds relative to contact (negative before). */
    local: number;
    /** Whether the action is active at all. */
    active: boolean;
    /** Wind-up progress in [0, 1]. */
    windup: number;
    /** Recovery progress in [0, 1]. */
    recovery: number;
  }

  /** Hold at full extension after contact, seconds. */
  export const HOLD: number = 0.035;

  /**
   * First and last active second of an action.
   *
   * @evidence contracts/common.md#implementation-and-ownership Wind-up before contact, hold and recovery after it.
   * @evidence contracts/common.md#authoring-interface Film seconds [start, end].
   */
  export function window(action: BoutScript.Action): readonly [number, number] {
    const spec = BoutScript.specs[action.technique];
    return [action.at - spec.windup, action.at + HOLD + spec.recovery];
  }

  /**
   * Envelope of an action at film second t.
   *
   * @evidence contracts/common.md#implementation-and-ownership Quartic extension to contact, a two-frame hold, smooth return.
   * @evidence contracts/common.md#authoring-interface Inactive outside the window.
   */
  export function envelope(action: BoutScript.Action, t: number): Envelope {
    const spec = BoutScript.specs[action.technique];
    const [start, end] = window(action);
    const local: number = t - action.at;
    if (t <= start || t >= end)
      return { extension: 0, local, active: false, windup: 0, recovery: 0 };
    const windup: number = Ease.unit((t - start) / spec.windup);
    const recovery: number = Ease.unit((t - action.at - HOLD) / spec.recovery);
    const extension: number =
      t < action.at
        ? 1 - (1 - windup) ** 4
        : t < action.at + HOLD
          ? 1
          : 1 - Ease.smooth(recovery);
    return { extension, local, active: true, windup, recovery };
  }

  /**
   * Glove centre goal of a punch.
   *
   * @evidence contracts/common.md#implementation-and-ownership Straight punches interpolate linearly; a hook's control point sits outside and above the line on the punching side, an uppercut's below it, each scaled by the guard-to-target distance.
   * @evidence contracts/common.md#authoring-interface `outward` is the world unit vector toward the punching arm's side, `extension` from {@link envelope}.
   */
  export function glove(
    technique: BoutScript.Technique,
    guard: Vec3.Value,
    target: Vec3.Value,
    outward: Vec3.Value,
    extension: number,
  ): Vec3.Value {
    const span: number = Vec3.distance(guard, target);
    const middle: Vec3.Value = Vec3.lerp(guard, target, 0.5);
    let control: Vec3.Value = middle;
    if (technique === "hook")
      control = Vec3.add(
        middle,
        Vec3.add(Vec3.scale(outward, 0.42 * span), [0, 0.06, 0]),
      );
    else if (technique === "body-hook")
      control = Vec3.add(
        middle,
        Vec3.add(Vec3.scale(outward, 0.38 * span), [0, -0.04, 0]),
      );
    else if (technique === "uppercut")
      control = Vec3.add(middle, [0, -0.32 * span, 0]);
    const u: number = extension;
    return Vec3.add(
      Vec3.add(
        Vec3.scale(guard, (1 - u) * (1 - u)),
        Vec3.scale(control, 2 * u * (1 - u)),
      ),
      Vec3.scale(target, u * u),
    );
  }

  /**
   * Kicking leg goals: ankle and knee in world metres.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain kick goal pair.
   * @evidence contracts/common.md#authoring-interface World metres.
   */
  export interface Leg {
    /** Ankle joint goal. */
    ankle: Vec3.Value;
    /** Knee goal. */
    knee: Vec3.Value;
  }

  /**
   * Roundhouse leg goals at one second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Four keyed leg shapes: planted (from the schedule), chamber (knee lifted toward the target with the shin folded), impact (shin centred on the target along the swing direction) and landing. Segments blend with quintic easing; the impact shape is held for the contact frames.
   * @evidence contracts/common.md#authoring-interface The caller supplies actual provider knee/ankle configurations for chamber and impact, plus the scheduled start and landing. This function owns film-time blending only.
   */
  export function kick(
    action: BoutScript.Action,
    t: number,
    input: {
      chamber: Leg;
      impact: Leg;
      start: Leg;
      land: Leg;
    },
  ): Leg {
    const spec = BoutScript.specs[action.technique];
    const chamber: Leg = input.chamber;
    const impact: Leg = input.impact;
    const begin: number = action.at - spec.windup;
    const end: number = action.at + HOLD + spec.recovery;
    const blend = (a: Leg, b: Leg, u: number): Leg => ({
      knee: Vec3.lerp(a.knee, b.knee, Ease.smoother(u)),
      ankle: Vec3.lerp(a.ankle, b.ankle, Ease.smoother(u)),
    });
    const chamberAt: number = begin + spec.windup * 0.45;
    if (t <= begin) return input.start;
    if (t < chamberAt)
      return blend(input.start, chamber, (t - begin) / (chamberAt - begin));
    if (t < action.at) {
      const contact: number = kickContactWeight(action, t);
      return {
        knee: Vec3.lerp(chamber.knee, impact.knee, contact),
        ankle: Vec3.lerp(chamber.ankle, impact.ankle, contact),
      };
    }
    if (t < action.at + HOLD) return impact;
    const rechamber: number = action.at + HOLD + spec.recovery * 0.5;
    if (t < rechamber)
      return blend(
        impact,
        chamber,
        (t - action.at - HOLD) / (rechamber - action.at - HOLD),
      );
    if (t < end)
      return blend(chamber, input.land, (t - rechamber) / (end - rechamber));
    return input.land;
  }

  /** Shared impact participation of the kick path; a target binding must not pull the chamber through the opponent's legs. */
  export function kickContactWeight(
    action: BoutScript.Action,
    seconds: number,
  ): number {
    const spec: (typeof BoutScript.specs)[BoutScript.Technique] =
      BoutScript.specs[action.technique];
    const chamber: number = action.at - spec.windup * 0.55;
    if (seconds <= chamber || seconds >= action.at + HOLD + spec.recovery * 0.5)
      return 0;
    if (seconds < action.at)
      return Ease.smoother(
        Ease.out((seconds - chamber) / (action.at - chamber)),
      );
    if (seconds < action.at + HOLD) return 1;
    return (
      1 - Ease.smoother((seconds - action.at - HOLD) / (spec.recovery * 0.5))
    );
  }

  /** Continuous preparation and withdrawal shared by the kicking-side forward guard and its displayed-geometry audit. This retains the screenplay's existing shoulder/trunk timing. */
  export function kickGuardWeight(
    action: BoutScript.Action,
    seconds: number,
  ): number {
    const [start, end]: readonly [number, number] = window(action);
    return Ease.plateau(
      seconds,
      start,
      action.at - 0.12,
      action.at + 0.12,
      end,
    );
  }
}
