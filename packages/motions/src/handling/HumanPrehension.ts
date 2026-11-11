import {
  type IAutoMovieRandom,
  Quaternion,
  Vector3,
  minimumJerk,
  superposeMinimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanSkill } from "../skill/HumanSkill";

/**
 * Reach to grasp as two coupled components, the model of prehension since
 * Jeannerod (1981, 1984): the transport carries the hand to the object and
 * the grasp shapes the hand, opening it to a peak aperture during the
 * transport and closing it on the object as the transport ends. Every number
 * here belongs to the reaching and grasping family; none is borrowed from
 * striking or locomotion.
 *
 * - Movement time. McIntosh, Mon-Williams and Tresilian (2018, J. Exp.
 *   Psychol. Hum. Percept. Perform. 44:1022, table 1) found reach-to-grasp
 *   time poorly fitted by Fitts' law and well fitted by a two-factor model,
 *   `MT = a + b lg A + c W` for the grasped width, with the group fit
 *   a = -306.07 ms, b = 297.27 ms per decade of amplitude A in millimetres and
 *   c = 0.65 ms per millimetre of width W (r^2 = 0.97). Amplitudes below the
 *   study's shortest (170 mm) take its value, since the fit is not valid
 *   there; skill varies the duration through the cross-task timing
 *   variability (`HumanSkill.jitter`), no study of reaching speed by
 *   proficiency having been located.
 * - Peak aperture. It scales with the object's width with a slope of about
 *   0.8 (Smeets and Brenner 1999, Motor Control 3:237, as cited by Utz et al.
 *   2015); the intercept, 25 mm, is provisional (the full regression was not
 *   reachable): it keeps the peak 5 mm above the widest graspable object,
 *   about 100 mm (McIntosh et al. 2018's hypothetical maximum grip).
 * - Peak timing. Aperture peaks at 60 to 70 % of the transport (Jeannerod
 *   1984, J. Mot. Behav. 16:235); a seeded draw places it inside that band.
 *
 * The transport path superposes two minimum-jerk units (Flash and Hogan
 * 1985; Flash and Henis 1991): the first carries the wrist from where it is to
 * an approach point set back from the grasp along the object's approach axis,
 * the second, overlapping its end, carries it the last stretch along that axis
 * onto the grasp, so the hand arrives moving along the approach and never
 * through the object, as the deceleration phase of a reach to grasp is the
 * longer one (McIntosh 2018, time after peak speed). Both units end at rest,
 * so the wrist stops exactly on the grasp with zero velocity and acceleration.
 * The hand turns to its grasp rotation on a minimum-jerk slerp finished by
 * the second unit's start, so it is oriented before the final approach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each law, its source and units, which constants are provisional, and the path and turn construction.
 * @evidence contracts/development/implementation.md#principled-implementation McIntosh 2018's two-factor movement time, Smeets and Brenner's aperture slope, Jeannerod's peak band, and superposed minimum-jerk units for the transport.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Small pure functions a grasping law composes: time, aperture, peak share, transport, shape schedule.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The provisional aperture intercept is named with its derivation; the movement-time fit is not extrapolated below its shortest tested amplitude.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per evaluation; the shape schedule is linear in the digit bones.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure functions; a law plans once and evaluates per frame.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Closures retain only their plan's numbers.
 */
export namespace HumanPrehension {
  /** McIntosh et al. 2018 two-factor intercept, seconds. */
  export const INTERCEPT: number = AutoMovieMotionHumanTiming.INTERCEPT;

  /** McIntosh et al. 2018 amplitude slope, seconds per decade of millimetres. */
  export const AMPLITUDE: number = AutoMovieMotionHumanTiming.AMPLITUDE;

  /** McIntosh et al. 2018 width slope, seconds per metre (0.65 ms per mm). */
  export const WIDTH: number = AutoMovieMotionHumanTiming.WIDTH;

  /** The shortest amplitude the fit was measured at, metres. */
  export const SHORTEST: number = AutoMovieMotionHumanTiming.SHORTEST;

  /**
   * Peak wrist speed while an object is carried in the hand, metres per
   * second; provisional. McIntosh's fit times a fast unloaded reach, and no
   * absolute transport time of a giver's loaded arm was located (Kopnarski
   * 2023 reviews none), so the loaded transports are capped at a moderate
   * peak instead.
   */
  export const CARRY_PEAK: number = 1.0;

  /** Peak-aperture slope on the object's width (Smeets and Brenner 1999). */
  export const APERTURE_SLOPE: number = 0.8;

  /** Peak-aperture intercept, metres; provisional. */
  export const APERTURE_INTERCEPT: number = 0.025;

  /** Share of the transport at which the first unit ends and the approach unit starts, and the approach unit's start. */
  export const APPROACH: Readonly<{ end: number; start: number }> = {
    end: 0.75,
    start: 0.45,
  };

  /**
   * A reach-to-grasp transport time, seconds, with the performer's timing
   * variability.
   *
   * @param skill The performer's skill.
   * @param random The action's draw stream for the duration.
   * @param distance Wrist travel, metres.
   * @param width Grasped width, metres; 0 for a touch.
   * @returns Seconds; positive.
   */
  export function duration(
    skill: HumanSkill.ISkill,
    random: IAutoMovieRandom,
    distance: number,
    width: number,
  ): number {
    return HumanSkill.jitter(skill, random, nominal(distance, width));
  }

  /**
   * The two-factor movement time without variability.
   *
   * @param distance Wrist travel, metres.
   * @param width Grasped width, metres.
   * @returns Seconds.
   */
  export function nominal(distance: number, width: number): number {
    return AutoMovieMotionHumanTiming.aimed(distance, width);
  }

  /**
   * The time of a direct transport with an object in the hand, seconds: the
   * reach time, lengthened until the minimum-jerk peak speed (1.875 times the
   * mean) stays at or under {@link CARRY_PEAK}.
   *
   * @param distance Wrist travel, metres.
   * @returns Seconds.
   */
  export function carry(distance: number): number {
    return Math.max(nominal(distance, 0), (1.875 * distance) / CARRY_PEAK);
  }

  /**
   * The peak grip aperture for an object width, metres.
   *
   * @param width The object's width across the grip, metres.
   * @returns The aperture.
   */
  export function aperture(width: number): number {
    return APERTURE_SLOPE * width + APERTURE_INTERCEPT;
  }

  /**
   * Where in the transport the aperture peaks: a seeded share in Jeannerod's
   * 60 to 70 % band.
   *
   * @param random The draw stream.
   * @returns The share.
   */
  export function peak(random: IAutoMovieRandom): number {
    return 0.6 + 0.1 * random.float(0);
  }

  /** A planned transport of the wrist and the hand's turn. */
  export interface ITransport {
    /** Seconds the transport lasts. */
    duration: number;

    /** The wrist at a second of the transport (clamped to its span), metres. */
    wrist(seconds: number): IAutoMovieVector3;

    /** The hand's world rotation at a second of the transport. */
    turn(seconds: number): IAutoMovieQuaternion;
  }

  /**
   * Plan a transport.
   *
   * @param from The wrist's start, metres.
   * @param to The wrist's grasp point, metres.
   * @param approach The unit direction the hand arrives along (into the object).
   * @param setback How far back along the approach the first unit ends, metres; 0 for a direct reach.
   * @param rotation The hand's world rotation at the start and at the grasp.
   * @param seconds The transport's duration.
   * @returns The transport.
   */
  export function transport(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    approach: IAutoMovieVector3,
    setback: number,
    rotation: { from: IAutoMovieQuaternion; to: IAutoMovieQuaternion },
    seconds: number,
  ): ITransport {
    if (!(seconds > 0)) throw new Error("A transport lasts a positive time");
    const via: IAutoMovieVector3 = Vector3.subtract(
      to,
      Vector3.scale(Vector3.normalize(approach), setback),
    );
    // A direct reach has no approach stretch: one unit spans the whole time,
    // so its peak speed is the minimum-jerk 1.875 times the mean and not the
    // first unit's share squeezed into three quarters of it.
    const units: superposeMinimumJerk.IUnit[] =
      setback === 0
        ? [
            {
              displacement: Vector3.subtract(to, from),
              start: 0,
              duration: seconds,
            },
          ]
        : [
            {
              displacement: Vector3.subtract(via, from),
              start: 0,
              duration: APPROACH.end * seconds,
            },
            {
              displacement: Vector3.subtract(to, via),
              start: APPROACH.start * seconds,
              duration: (1 - APPROACH.start) * seconds,
            },
          ];
    return {
      duration: seconds,
      wrist: (t: number): IAutoMovieVector3 =>
        superposeMinimumJerk(from, units, Math.min(seconds, Math.max(0, t)))
          .position,
      turn: (t: number): IAutoMovieQuaternion =>
        Quaternion.slerp(
          rotation.from,
          rotation.to,
          minimumJerk(t / (APPROACH.start * seconds)).s,
        ),
    };
  }

  /**
   * The finger angles of a grasp at a share of its transport: from the
   * entry shape to the open pre-shape by the peak share, then closing onto
   * the grasp by the end, each phase on a minimum-jerk profile so the digits
   * start and stop smoothly.
   *
   * @param shapes The entry, pre-shape and grasp angles of the hand's digits, clinical degrees.
   * @param peak The share of the peak aperture.
   * @param u The share of the transport, clamped to [0, 1].
   * @returns The angles.
   */
  export function shape(
    shapes: Readonly<
      Record<
        "entry" | "open" | "closed",
        Partial<
          Record<AutoMovieHumanoidBone, readonly [number, number, number]>
        >
      >
    >,
    peak: number,
    u: number,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const s: number = Math.min(1, Math.max(0, u));
    const [a, b, w] =
      s <= peak
        ? [shapes.entry, shapes.open, minimumJerk(s / peak).s]
        : [shapes.open, shapes.closed, minimumJerk((s - peak) / (1 - peak)).s];
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const bone of new Set([
      ...Object.keys(a),
      ...Object.keys(b),
    ]) as Set<AutoMovieHumanoidBone>) {
      const x: readonly [number, number, number] = a[bone] ?? [0, 0, 0];
      const y: readonly [number, number, number] = b[bone] ?? [0, 0, 0];
      out[bone] = [
        x[0] + (y[0] - x[0]) * w,
        x[1] + (y[1] - x[1]) * w,
        x[2] + (y[2] - x[2]) * w,
      ];
    }
    return out;
  }
}
