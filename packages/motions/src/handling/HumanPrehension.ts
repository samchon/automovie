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
 * @evidence contracts/development/design.md#principled-representation Metre distances/widths determine second-based timing; transports expose world-metre wrist points and world hand rotations, and clinical-degree digit endpoints vary through a dimensionless peak/share schedule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Handling laws share timing, aperture, transport and shape owners; ITransport exposes only duration/wrist/turn, and prepareShape shares fixed endpoints used by actual pick-up, release and exchange plans.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Body/prop geometry remains caller data, timing delegates its canonical owner, and original cited/provisional constants remain named; no fixture, cached pose or parallel motion model is represented.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States skill, duration draw stream, metre travel/width and realised seconds; the namespace cites the movement-time and cross-task variability models.
   * @evidence contracts/development/implementation.md#principled-implementation Computes the existing two-factor nominal time then HumanSkill.jitter's original additive/proportional timing variation and positive floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nominal call feeds the existing skill-variation owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Draw indices, skill quantities, measured amplitude floor and original duration floor remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar/logarithm/normal-draw work; there is no body scan or numerical search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares nominal and HumanSkill.jitter with existing timing consumers; the actual random stream is read afresh without a duration cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no skill, draw stream, caller state or handle.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines metre wrist travel/grasp width and unvaried second output under the cited two-factor model.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to Timing.aimed's McIntosh coefficients, shortest-amplitude floor and nonnegative width term.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One facade preserves a single canonical aimed movement-time owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No duration fitting, coefficient change, new validation or extrapolation rule is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar/logarithm work in the delegated formula, with no allocation or scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The prehension facade and other aimed actions share the same timing formula and constants without caching inputs/results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a number and retains no arguments, state, history or external handle.
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
   * @evidence contracts/development/common.md#meaningful-documentation States loaded travel in metres, returned seconds and the provisional CARRY_PEAK origin/peak-to-mean relation.
   * @evidence contracts/development/implementation.md#principled-implementation Takes the maximum of the original unloaded nominal time and minimum-jerk peak-speed duration 1.875*distance/CARRY_PEAK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nominal query and one direct speed bound feed Math.max.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the named provisional speed and original ratio, with no body/prop-specific timing compensation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant formula work with no per-frame state, scan or numerical solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses nominal rather than copying its movement-time formula; every actual distance is evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no body, path, result history or handle.
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
   * @evidence contracts/development/common.md#meaningful-documentation States width/aperture metre units and the namespace's cited slope/provisional intercept basis.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the original linear aperture-width relation APERTURE_SLOPE*width+APERTURE_INTERCEPT.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One named slope/intercept expression owns the family relation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No width clipping, guessed collider width or extra safety margin changes the original formula.
   * @evidence contracts/development/implementation.md#efficient-algorithms One multiplication and addition, with no allocation or varying population.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All pre-shape callers use this same relation; no effectful input or computed answer is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no input, state, history or handle.
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
   * @evidence contracts/development/common.md#meaningful-documentation Defines the stream and dimensionless seeded peak share in the cited 0.6-to-0.7 transport band.
   * @evidence contracts/development/implementation.md#principled-implementation Maps the original stream.float(0) by the unchanged affine 0.6+0.1*draw rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One indexed draw and affine map own the family's peak timing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original stream index and cited band without extra draws, quantization or fixture variation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One stream read and constant scalar arithmetic with no scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every requested draw uses its supplied stream; no output or in-flight randomness is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no draw stream, state, history or handle.
   */
  export function peak(random: IAutoMovieRandom): number {
    return 0.6 + 0.1 * random.float(0);
  }

  /**
   * A planned transport of the wrist and the hand's turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state duration seconds, world-metre wrist query and world hand-rotation query; each reader consumes transport-relative seconds.
   * @evidence contracts/development/design.md#principled-representation One positive-duration path exposes independent point and attitude evaluations; transport admits duration and the engine retains finite-time/quaternion numerical contracts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Pick-up, put-down, clasp and handover read exactly these three members; vectors and quaternions remain interface-owned types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No stored samples, previous frame, body-specific path, fabricated contact or overloaded time unit is represented.
   */
  export interface ITransport {
    /** Seconds the transport lasts. */
    duration: number;

    /**
     * The wrist at a second of the transport (clamped to its span), metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The argument is transport-relative seconds and output a fresh world-metre point held at the path endpoints outside its span.
     * @evidence contracts/development/implementation.md#principled-implementation transport supplies the original one/two-unit minimum-jerk superposition at the same clamped second and returns its position.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamped evaluation delegates all unit polynomial/accumulation arithmetic to the engine owner.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No path samples, time quantization, derivative approximation or contact adjustment replaces the original exact query.
     * @evidence contracts/development/implementation.md#efficient-algorithms Evaluates the original one direct unit or two overlapping units in constant work; the engine's position-only read omits unused derivative profiles, velocity/acceleration vectors and state wrapper while returning the same fresh point. Speedup is unmeasured.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable plan owns its original origin/unit geometry; each second is actually evaluated without a time/result cache.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains fixed origin/unit vectors and duration until release; a query returns a fresh point without retaining its time or output.
     */
    wrist(seconds: number): IAutoMovieVector3;

    /**
     * The hand's world rotation at a second of the transport.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The argument is transport-relative seconds and output the original world hand attitude, reaching its final rotation by APPROACH.start of duration.
     * @evidence contracts/development/implementation.md#principled-implementation transport slerps the original endpoint rotations by the same minimum-jerk scalar at t/(APPROACH.start*duration).
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar profile query and one quaternion interpolation retain shared polynomial/quaternion owners.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original finite admission, endpoint clipping, slerp grouping and approach timing remain unchanged.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar and quaternion work; only requested displacement share is computed and derivative profiles are not allocated.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed endpoint rotations/duration are plan data while every time computes its actual interpolation, without answer reuse across times.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan borrows the fixed rotation pair until release and retains no queried second, prior quaternion, history or handle.
     */
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
   * @throws {Error} When duration is not positive; numerical readers retain the engine's original admission.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world-metre endpoints/setback, approach direction, endpoint attitudes, second duration, positive-time refusal and returned independent point/turn readers.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original normalized approach setback and one direct unit or two overlapping minimum-jerk units (Flash/Henis), with an attitude slerp finishing by the approach unit's start.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Original via/unit preparation precedes point and turn readers that delegate profiles, superposition and actual current endpoint slerp to their existing engine owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original positive-duration admission, exact-zero setback branch, APPROACH timing and all displacement/arithmetic ordering remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Original one/two displacement units prepare once. Position-only and scalar profile owners omit unused derivatives, while every turn still reads current endpoint rotations and performs original slerp/normalization. All queries take constant work without body/collider searches; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only originally prepared path displacements/duration are retained. Public borrowed rotation endpoints have no new immutable premise: their original field reads, arc preparation and actual interpolation execute for every turn without result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the original path/rotation references and at-most-two units until release. Outputs remain fresh and no endpoint coefficient snapshot, queried time, interpolated result, FK workspace, external handle or task is retained.
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
        superposeMinimumJerk.position(from, units, Math.min(seconds, Math.max(0, t))),
      turn: (t: number): IAutoMovieQuaternion => Quaternion.slerp(
        rotation.from, rotation.to, minimumJerk.share(t / (APPROACH.start * seconds)),
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
   * @evidence contracts/development/common.md#meaningful-documentation Defines clinical-degree entry/open/closed joints, peak/share inputs, clamped two-phase timing and fresh joint-angle output.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original Jeannerod peak schedule and source-first minimum-jerk phase selection before the shared live tuple interpolation owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original phase selects its two current endpoint maps and actual weight, then cold owns ordered key/tuple reading without a fixed-source snapshot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Phase choice, inclusive peak, key insertion order, absent-joint zeros and original minimum-jerk admission/clipping are unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms One cold call prepares/evaluates the actual phase in O(D) digit bones, without full-body geometry or IK; fixed plans can avoid repeated key/set/tuple preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Public calls use the shared cold interpolation policy, preserving current raw endpoint reads; explicit fixed schedules select the separate coefficient producer only under its unchanged-primitive premise. Neither entry retains an evaluated result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Phase locals and cold interpolation scratch release at return; fresh angle tuples escape and this facade retains no source shape, coefficient list, query history or handle.
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
    return prepareHumanShapeBlend.cold(a, b, w);
  }

  /**
   * Prepare one unchanged entry/open/closed digit schedule for actual shares.
   * The source tuples and peak stay unchanged for the plan's lifetime. Each
   * phase reads its ordered key union and endpoints on first actual use;
   * later shares still run the original clipping, weight and tuple blend.
   *
   * @param shapes The fixed clinical-degree endpoint tuples.
   * @param peak The fixed original peak share.
   * @returns Fresh angle tuples for each current transport share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed source/peak lifetime, lazy per-phase endpoint admission, actual share input and fresh clinical-degree output.
   * @evidence contracts/development/implementation.md#principled-implementation Prepares the same ordered union and absent-zero tuples independent of time; the actual inclusive peak branch and original minimum-jerk weight feed unchanged x+(y-x)*w component arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared clinical shape-blend owner prepares each phase's endpoints/differences; one actual query selects its phase and computes the original minimum-jerk weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each phase keeps its own original key union and order, with no whole-schedule union, clamping change, baked shape, skipped weight admission or dropped digit.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two O(D) phase preparations replace per-frame Object.keys/Set/endpoint work and scalar differences; every actual output still performs O(D) required interpolation/allocation, and inactive phases remain unprepared. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicitly unchanged endpoint tuples and peak establish phase geometry equivalence; scalar snapshots isolate output edits, and changed schedules require new preparation rather than a time/result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning plan retains the schedule plus at most two D-key scalar/difference lists until release; the shared blend drops its source references after first use. Every output object/tuple is fresh and no sampled share, pose history, external handle or task is retained.
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

