import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditLimits } from "../../audit/internal/AutoMovieMotionHumanAuditLimits";
import { hipJoints } from "./hipJoints";
import { humanPostureHeading } from "./humanPostureHeading";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/** An absent plant, distinct from an invalid point on a present plant. */
const NO_PLANT: unique symbol = Symbol();

/**
 * A posture with its root lowered along gravity to the highest height at which
 * every planted leg reaches its goal with at least `knee` degrees of knee
 * flexion: a standing body bends its knees rather than letting a foot leave its
 * plant, the root adjustment of footskate cleanup (Kovar, Schreiner and
 * Gleicher 2002). The hip joints are read from the posture's root, heading and
 * trunk joints, so a turned or listed pelvis counts. A leg whose goal lies
 * horizontally beyond its reach cannot be helped by lowering and is left to the
 * audits.
 *
 * @param body The performer's body.
 * @param posture The posture; legs with `planted` goals are kept reachable.
 * @param knee The least knee flexion, degrees; a planted leg's
 *   (`lowerHumanPosture.KNEE`) when absent.
 * @param resolution Optional exact FK reader or lazy supplier borrowed from
 *   this synchronous person evaluation; never requested without an actual
 *   planted-leg read.
 * @param step The hip's largest vertical step a frame of the audit's rate in
 *   the motion this posture is read from, metres (its law's planned hip
 *   course); given, the reach is eased over the soft band that step asks
 *   (soft), so the knee straightens continuously; absent, the reach is hard.
 * @returns The posture, its root lowered when needed.
 */
export function lowerHumanPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  knee: number = lowerHumanPosture.KNEE,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  step?: number,
): IAutoMovieMotionHumanPosture {
  return lower(body, posture, knee, resolution, undefined, step);
}
/**
 * One current-goal/hip/drop law; the optional scalar reader belongs only to
 * this producer.
 */
function lower(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  knee: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  readShort?: ReturnType<typeof lowerHumanPosture.prepareShort>,
  step?: number,
): IAutoMovieMotionHumanPosture {
  // Only world-anchored plants are lowered for: a leg goal attached to a
  // bone moves with that bone, so the root cannot be solved against it here.
  const left: LowerLeft = worldPlant(posture.limbs.leftLeg);
  const right: LowerRight = worldPlant(posture.limbs.rightLeg);
  if (left === NO_PLANT && right === NO_PLANT) return posture;
  const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
    body,
    posture.root,
    humanPostureHeading(posture),
    posture.joints.hips,
    resolution === undefined
      ? undefined
      : prepareHumanPoseResolution.read(resolution),
  );
  let drop: number = 0;
  if (left !== NO_PLANT)
    drop = Math.max(
      drop,
      readShort === undefined
        ? lowerHumanPosture.short(body, hips.left, left, knee, step)
        : readShort(hips.left, left),
    );
  if (right !== NO_PLANT)
    drop = Math.max(
      drop,
      readShort === undefined
        ? lowerHumanPosture.short(body, hips.right, right, knee, step)
        : readShort(hips.right, right),
    );
  return drop === 0
    ? posture
    : { ...posture, root: { ...posture.root, y: posture.root.y - drop } };
}

/** Read an actual world-anchored plant before hip FK. */
function worldPlant(
  goal: IAutoMovieHumanLimbGoal | undefined,
): WorldPlantResult {
  return goal?.planted === true && goal.on === undefined
    ? goal.point
    : NO_PLANT;
}

/** Scalar reach geometry used by posture lowering. */
export namespace lowerHumanPosture {
  /**
   * The least knee flexion of a planted leg, degrees: the knee's greatest
   * extension in stance, about 5 degrees at initial contact and through
   * terminal stance (Perry and Burnfield 2010, Gait Analysis: Normal and
   * Pathological Function, ch. 7; provisional, read through secondary
   * summaries, the primary not read). Every planted leg's lowering and every
   * walking stance (`walkReach`) keeps it.
   */
  export const KNEE: number = 5;

  /**
   * Bind the actual unchanged body and minimum knee degrees for repeated
   * current-posture lowering. Every query still collects its world plants,
   * resolves current hips with its own optional synchronous FK loan and runs
   * the original greatest-drop law. The fixed reach is prepared here, once,
   * through prepareShort; a no-plant query reads no FK supplier.
   *
   * All strict horizontal comparisons, negative slack, -Infinity and output
   * identity rules stay with the raw law. Body dimensions/knee must remain
   * unchanged or be prepared again. One factory closure and one scalar-reach
   * reader remain with the caller; postures, loans, points and results are
   * never retained, and each query performs its actual geometry.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    knee: number = KNEE,
    step?: number,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieMotionHumanPosture {
    const read: ReturnType<typeof prepareShort> = prepareShort(
      body,
      knee,
      step,
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture =>
      lower(body, posture, knee, resolution, read);
  }

  /**
   * Prepare actual fixed thigh/shank lengths and minimum knee degrees once. The
   * cosine-law reach and its square root are computed by the same owner as raw
   * short. Each returned read still evaluates its current world-metre hip/ankle
   * hypot, strict reach comparison and vertical subtraction/square root in the
   * original order, including negative slack and -Infinity. Keep dimensions and
   * knee unchanged or prepare again; no input validation, threshold, clamp or
   * target substitution is added. Preparation and reads are constant-time; only
   * the reach constants survive until caller release, without retaining the
   * body, points or any query-result history.
   */
  export function prepareShort(
    body: IAutoMovieMotionHumanBody,
    knee: number,
    step?: number,
  ): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
    const reach: IReach = reachLimit(body, knee, step);
    return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number =>
      reachDrop(reach, hip, ankle);
  }

  /**
   * How far a hip joint stands above the height from which its leg reaches an
   * ankle with `knee` degrees of knee flexion: the lowering that leg asks of
   * the root, by Pythagoras on the leg's length at that flexion and the ankle's
   * horizontal distance.
   *
   * @param body The performer's body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param knee The least knee flexion, degrees.
   * @param step The hip's largest vertical step a frame, metres, for the soft
   *   band (soft); absent, the reach is hard.
   * @returns Metres, negative by the slack of a leg that reaches with more
   *   flexion, and `-Infinity` for an ankle horizontally beyond the leg's
   *   reach, which no lowering helps.
   *
   *   The cosine law gives squared reach a_a+b_b+2_a_b*cos(knee), and Pythagoras
   *   removes horizontal span to recover maximum vertical reach.
   *   Equality/outside reach keeps -Infinity; no target displacement or clamp
   *   is introduced. This constant scalar query traverses no rig, coordinates
   *   no cross-query result and retains no body, input or external resource.
   */
  export function short(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    knee: number,
    step?: number,
  ): number {
    return reachDrop(reachLimit(body, knee, step), hip, ankle);
  }
}
/**
 * The leg's reach at `knee` degrees, with the soft band a hip moving `step`
 * metres a frame asks (`soft`).
 */
function reachLimit(
  body: IAutoMovieMotionHumanBody,
  knee: number,
  step?: number,
): IReach {
  const a: number = body.measure.thigh;
  const b: number = body.measure.shank;
  const limit: number = Math.sqrt(
    a * a + b * b + 2 * a * b * Math.cos((knee * Math.PI) / 180),
  );
  return {
    limit,
    limitSquared: limit * limit,
    width: step === undefined ? 0 : soft(a, b, limit, step),
  };
}

/**
 * The width of the soft band that keeps a knee near full extension within the
 * audit's jump bound (`AutoMovieMotionHumanAuditLimits.jump`, 5 mm a frame)
 * while the hip moves `step` metres a frame: soft IK (Nicholas 2009, "Soft IK",
 * the hip-to-ankle reach eased over a last width before full extension).
 *
 * Near a straight knee a two-segment leg of lengths `a` and `b` holds its knee
 * `h = sqrt(2 c G)` off the hip-ankle line, `c = ab / (a + b)` and `G` the gap
 * of the reach to the straight leg, so the knee moves `c / h` per unit of
 * reach: without bound as the leg straightens. Eased over a band of width `w`
 * ending at the least-flexion reach, the reach moves by `g / w` of the hip's
 * motion, `g` its gap to that reach, so the knee moves at most `sqrt(c / (2 (w
 *
 * - G0))) step`a frame,`g0`the straight leg's gap to the least-flexion reach,
 *   greatest at the band's entry. Held to the bound`J`, `w >= c step^2 / (2
 *   J^2) - g0`; a slow enough hip needs no band.
 */
function soft(a: number, b: number, limit: number, step: number): number {
  const c: number = (a * b) / (a + b);
  const jump: number = AutoMovieMotionHumanAuditLimits.jump;
  return Math.max(0, (c * step * step) / (2 * jump * jump) - (a + b - limit));
}

/**
 * The lowering one leg asks of the root at current points, metres: the strict
 * horizontal reach refusal (`-Infinity`) first, then the hip's height over the
 * ankle against the leg's vertical reach. A hard reach (`width` 0) asks the
 * excess over that reach and reports a reach to spare as negative slack. A soft
 * reach eases the leg's vertical extent over the band below it, `s(v) = (V -
 * w)
 *
 * - W (1 - exp(-(v - (V - w)) / w))`for a hip`v` above the band's start, so a hip
 *   rising through full extension straightens the knee continuously, and
 *   measures slack to the band's start below it.
 */
function reachDrop(
  reach: IReach,
  hip: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
): number {
  const dh: number = Math.hypot(hip.x - ankle.x, hip.z - ankle.z);
  if (!(dh < reach.limit)) return -Infinity;
  const vertical: number = Math.sqrt(reach.limitSquared - dh * dh);
  const v: number = hip.y - ankle.y;
  if (!(reach.width > 0)) return v - vertical;
  const w: number = Math.min(reach.width, vertical);
  const start: number = vertical - w;
  return v <= start
    ? v - start
    : v - (start + w * (1 - Math.exp(-(v - start) / w)));
}

/** The alternatives of `LowerRight`'s site. */
type LowerRight = IAutoMovieVector3 | typeof NO_PLANT;

/** The alternatives of `LowerLeft`'s site. */
type LowerLeft = IAutoMovieVector3 | typeof NO_PLANT;

/** The alternatives of `WorldPlantResult`'s site. */
type WorldPlantResult = IAutoMovieVector3 | typeof NO_PLANT;

/**
 * A leg's fixed reach: the two-segment cosine-law length at the least knee
 * flexion, metres, its squared rounded value and the width of its soft band
 * (`soft`).
 */
interface IReach {
  /** The hip-to-ankle length at `knee` degrees of flexion, metres. */
  limit: number;

  /** The square of the rounded length, used by the original vertical formula. */
  limitSquared: number;

  /** The soft band's width below that length, metres; 0 for the hard reach. */
  width: number;
}
