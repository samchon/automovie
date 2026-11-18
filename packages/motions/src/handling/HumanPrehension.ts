import {
  Quaternion,
  Vector3,
  minimumJerk,
  superposeMinimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieMotionHumanSkill,
  IAutoMovieQuaternion,
  IAutoMovieRandom,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanSkill } from "../skill/HumanSkill";
import { prepareHumanShapeBlend } from "./prepareHumanShapeBlend";

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
 * @evidence contracts/development/design.md#principled-representation Metre distances and widths determine second-based timing; transports expose world-metre wrist points and world hand rotations, and clinical-degree digit shapes vary on a unitless peak and share schedule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Handling laws share the timing, aperture, transport and shape owners; ITransport exposes only duration, wrist and turn, and prepareShape serves the pick-up, release and exchange plans.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Body and prop geometry stay caller data, timing delegates its owner, and each constant is cited or named provisional.
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

  /**
   * The shares of the transport at which the first unit ends and the
   * approach unit starts (provisional: no located study gives the split of a
   * two-unit reach to grasp; the overlap of 0.3 of the transport keeps the
   * approach unit the longer one, 0.55 of the transport, as a reach to
   * grasp's deceleration phase is, McIntosh et al. 2018). The hand's turn
   * also finishes by `start`.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States skill, duration draw stream, metre travel and width and the seconds returned; the namespace cites the movement-time and cross-task variability models.
   * @evidence contracts/development/implementation.md#principled-implementation The two-factor nominal time (McIntosh et al. 2018) varied by HumanSkill.jitter's constant-plus-proportional timing variance (Wing and Kristofferson 1973), floored positive there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nominal call feeds the skill-variation owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Amplitudes below the study's shortest take its value rather than an extrapolation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar, logarithm and draw work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares nominal and HumanSkill.jitter with the other timed actions.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains nothing.
   */
  export function duration(
    skill: IAutoMovieMotionHumanSkill,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines metre wrist travel and grasp width and the unvaried seconds under the cited two-factor model.
   * @evidence contracts/development/implementation.md#principled-implementation AutoMovieMotionHumanTiming.aimed evaluates McIntosh's coefficients with the shortest-amplitude floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation to the aimed movement-time owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The coefficients are the study's group fit.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Prehension and the other aimed actions share one formula.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a number and retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States loaded travel in metres, the seconds returned and the provisional CARRY_PEAK with the peak-to-mean relation.
   * @evidence contracts/development/implementation.md#principled-implementation The larger of the unloaded nominal time and the time whose minimum-jerk peak speed, 15/8 of the mean (Flash and Hogan 1985), is CARRY_PEAK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nominal query and one speed bound.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The peak speed is named provisional at its declaration.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant formula work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses nominal rather than copying its formula.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains nothing.
   */
  export function carry(distance: number): number {
    return Math.max(nominal(distance, 0), (1.875 * distance) / CARRY_PEAK);
  }

  /**
   * The peak grip aperture for an object width, metres.
   *
   * @param width The object's width across the grip, metres.
   * @returns The aperture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the metre units and the namespace's cited slope and provisional intercept.
   * @evidence contracts/development/implementation.md#principled-implementation The linear aperture-width relation of Smeets and Brenner 1999, APERTURE_SLOPE * width + APERTURE_INTERCEPT.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression of two named constants.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clipping or margin.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One multiplication and one addition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every pre-shape reads this one relation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the stream and the seeded peak share in the cited 0.6-to-0.7 band.
   * @evidence contracts/development/implementation.md#principled-implementation A uniform draw of the stream's quantity 0 mapped onto Jeannerod's band, 0.6 + 0.1 * draw.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One keyed draw and one affine map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The seed varies the share only inside the study's band.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One draw and constant arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The draw is keyed by the supplied stream, so other draws are unaffected.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains nothing.
   */
  export function peak(random: IAutoMovieRandom): number {
    return 0.6 + 0.1 * random.float(0);
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
   * @throws {Error} When duration is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world-metre endpoints and setback, the approach direction, endpoint attitudes, second duration, the refusal and the point and turn readers returned.
   * @evidence contracts/development/implementation.md#principled-implementation One minimum-jerk unit for a direct reach, or two overlapping units superposed (Flash and Henis 1991) through the set-back approach point; the attitude slerps on a minimum-jerk share that finishes at APPROACH.start, also for a direct reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Units are prepared once; the readers delegate profiles, superposition and slerp to the engine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A zero setback takes the single unit, so its peak speed is the minimum-jerk 15/8 of the mean; times outside the transport read its ends.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The units are prepared once per transport.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The readers hold at most two units and the endpoint rotations until released.
   */
  export function transport(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    approach: IAutoMovieVector3,
    setback: number,
    rotation: IAutoMovieMotionHumanPrehension.ITransportRotation,
    seconds: number,
  ): IAutoMovieMotionHumanPrehension.ITransport {
    if (!(seconds > 0)) throw new Error("A transport lasts a positive time");
    const via: IAutoMovieVector3 = Vector3.subtract(
      to,
      Vector3.scale(Vector3.normalize(approach), setback),
    );
    // A direct reach has no approach stretch: one unit spans the whole time,
    // so its peak speed is the minimum-jerk 1.875 times the mean and not the
    // first unit's share squeezed into three quarters of it.
    const units: IAutoMovieSuperposeMinimumJerk.IUnit[] =
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
    // The hand is oriented by the time the approach unit starts; a direct
    // reach has no approach unit, so its turn spans the whole transport, as
    // its one position unit does.
    const turning: number = setback === 0 ? seconds : APPROACH.start * seconds;
    return {
      duration: seconds,
      wrist: (t: number): IAutoMovieVector3 =>
        superposeMinimumJerk.position(from, units, Math.min(seconds, Math.max(0, t))),
      turn: (t: number): IAutoMovieQuaternion => Quaternion.slerp(
        rotation.from, rotation.to, minimumJerk.share(t / turning),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the clinical-degree entry, open and closed shapes, the peak and share inputs, the clamped two-phase timing and the fresh angles returned.
   * @evidence contracts/development/implementation.md#principled-implementation Jeannerod's opening-then-closing aperture schedule, each phase on a minimum-jerk weight (Flash and Hogan 1985), blended by `prepareHumanShapeBlend`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One phase choice, one weight, one blend; `prepareShape` is the same schedule prepared for a plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The peak share itself belongs to the opening phase; a bone a shape leaves out reads as zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(D) work in the D digit bones, no geometry or IK.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A plan that samples the schedule repeatedly prepares it once with `prepareShape`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh tuples and retains nothing.
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
    const [a, b, w]: [ReturnType<typeof shape>, ReturnType<typeof shape>, number] = s <= peak
      ? [shapes.entry, shapes.open, minimumJerk.share(s / peak)]
      : [shapes.open, shapes.closed, minimumJerk.share((s - peak) / (1 - peak))];
    return prepareHumanShapeBlend(a, b)(w);
  }

  /**
   * The schedule of {@link shape} prepared for a plan that samples it at
   * many shares: each phase's blend is prepared on its first use.
   *
   * @param shapes The entry, pre-shape and grasp angles, clinical degrees; unchanged through the plan.
   * @param peak The share of the peak aperture.
   * @returns The angles at a share of the transport, clamped to [0, 1], fresh tuples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed shapes and peak, the share input and the fresh angles returned, equal to `shape`'s.
   * @evidence contracts/development/implementation.md#principled-implementation The same phase choice and minimum-jerk weight as `shape`, over blends prepared once per phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two lazily prepared phase blends and one weight per share.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each phase keeps its own key union, as `shape` does.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two O(D) preparations per plan, then O(D) per share.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A phase's blend depends only on its two shapes, which the plan holds fixed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the shapes and at most two prepared blends until it is released.
   */
  export function prepareShape(
    shapes: Parameters<typeof shape>[0],
    peak: number,
  ): (u: number) => ReturnType<typeof shape> {
    let opening: ReturnType<typeof prepareHumanShapeBlend> | undefined;
    let closing: ReturnType<typeof prepareHumanShapeBlend> | undefined;
    return (u: number): ReturnType<typeof shape> => {
      const s: number = Math.min(1, Math.max(0, u));
      const opens: boolean = s <= peak;
      const w: number = opens ? minimumJerk.share(s / peak) : minimumJerk.share((s - peak) / (1 - peak));
      const blend: ReturnType<typeof prepareHumanShapeBlend> = opens
        ? (opening ??= prepareHumanShapeBlend(shapes.entry, shapes.open))
        : (closing ??= prepareHumanShapeBlend(shapes.open, shapes.closed));
      return blend(w);
    };
  }
}

