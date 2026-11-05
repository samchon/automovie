import { Ease } from "../rig/Ease";
import { Vec3 } from "../rig/Vec3";
import { BoutScript } from "./BoutScript";

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
    /** Extension toward the target in [0, 1]. */ extension: number;
    /** Seconds relative to contact (negative before). */ local: number;
    /** Whether the action is active at all. */ active: boolean;
    /** Wind-up progress in [0, 1]. */ windup: number;
    /** Recovery progress in [0, 1]. */ recovery: number;
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
    /** Ankle joint goal. */ ankle: Vec3.Value;
    /** Knee goal. */ knee: Vec3.Value;
  }

  /**
   * Roundhouse leg goals at one second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Four keyed leg shapes: planted (from the schedule), chamber (knee lifted toward the target with the shin folded), impact (shin centred on the target along the swing direction) and landing. Segments blend with quintic easing; the impact shape is held for the contact frames.
   * @evidence contracts/common.md#authoring-interface `hip` is the kicking hip joint, `forward` the attacker's heading unit, `swing` the horizontal direction the shin travels through the target, `start`/`land` the planted ankle goals before and after.
   */
  export function kick(
    action: BoutScript.Action,
    t: number,
    input: {
      hip: Vec3.Value;
      forward: Vec3.Value;
      swing: Vec3.Value;
      target: Vec3.Value;
      start: Leg;
      land: Leg;
    },
  ): Leg {
    const spec = BoutScript.specs[action.technique];
    const high: number =
      action.technique === "high-kick"
        ? 1
        : action.technique === "body-kick"
          ? 0.55
          : 0;

    // Chamber: knee up and toward the target, foot tucked under the thigh.
    const toward: Vec3.Value = Vec3.normalize(
      Vec3.lerp(input.forward, Vec3.scale(input.swing, -1), 0.35),
    );
    const chamberKnee: Vec3.Value = Vec3.add(
      input.hip,
      Vec3.add(Vec3.scale(toward, 0.3 + 0.08 * high), [
        0,
        -0.16 + 0.22 * high,
        0,
      ]),
    );
    const chamber: Leg = {
      knee: chamberKnee,
      ankle: Vec3.add(
        chamberKnee,
        Vec3.add(Vec3.scale(input.forward, -0.18 - 0.08 * high), [
          0,
          -0.3 + 0.12 * high,
          0,
        ]),
      ),
    };

    // Impact: the nearly straight leg points from the hip through the target, the
    // knee leading slightly against the swing so the lower shin sweeps across it
    // (PLOS Fig. 3D: extended kicking leg, trunk leaning away).
    const line: Vec3.Value = Vec3.normalize(Vec3.sub(input.target, input.hip));

    // A head kick lands with the lower shin and instep: the knee stays slightly bent,
    // so the shin can rise above the thigh line that hip mobility allows.
    const impact: Leg =
      action.technique === "high-kick"
        ? {
            knee: Vec3.add(
              Vec3.add(input.hip, Vec3.scale(line, 0.4)),
              [0, -0.04, 0],
            ),
            ankle: Vec3.add(input.target, Vec3.scale(input.swing, 0.04)),
          }
        : {
            knee: Vec3.add(
              Vec3.add(input.hip, Vec3.scale(line, 0.4)),
              Vec3.scale(input.swing, -0.06),
            ),
            ankle: Vec3.add(
              Vec3.add(input.hip, Vec3.scale(line, 0.84)),
              Vec3.scale(input.swing, 0.12),
            ),
          };
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
      // The shin whips around: the ankle trails, then overtakes the knee.
      const u: number = (t - chamberAt) / (action.at - chamberAt);
      const leg: Leg = blend(chamber, impact, Ease.out(u));
      return {
        knee: leg.knee,
        ankle: Vec3.add(
          leg.ankle,
          Vec3.scale(input.swing, -0.12 * Math.sin(Math.PI * u)),
        ),
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
}
