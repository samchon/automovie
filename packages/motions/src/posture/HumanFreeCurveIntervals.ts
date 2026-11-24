import { Quaternion, ROM_TOLERANCE, hingedArmSwivel } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { HumanFreeCurveFit } from "./HumanFreeCurveFit";
import { HumanPostureRaw } from "./HumanPostureRaw";
import type { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";

/**
 * The canonical directed dyadic intervals of a free-leg curve
 * (`prepareHumanFreeCurve`): each interval's endpoint classification, kept
 * within the curve's retained-work budget, and each boundary's canonical
 * left-before-right construction, read from the curve's authoring, interval
 * records and correction.
 *
 * @param scope What the curve builds the intervals from.
 * @returns The interval readers.
 */
export function HumanFreeCurveIntervals(
  scope: HumanFreeCurveIntervals.IScope,
): HumanFreeCurveIntervals.IIntervals {
  const { at, intervals, correct }: HumanFreeCurveIntervals.IScope = scope;
  /**
   * Classify one canonical directed dyadic interval once. Its endpoint fit is
   * only a seed construction, never a certificate for an unsolved interior.
   * Each interval has one canonical parent and left-anchor construction, so
   * eviction rebuilds the same data regardless of previous query order.
   */
  function interval(
    from: number,
    to: number,
    left: IAnchor,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): IInterval {
    const key: string = `${from}:${to}`;
    const known: IInterval | undefined = intervals.get(key);
    if (known !== undefined) {
      intervals.delete(key);
      intervals.set(key, known);
      return known;
    }
    const raw: IAutoMovieMotionHumanPosture = at(to);
    const corrected: ICorrection | undefined = excludesFootTurn(raw, left)
      ? undefined
      : correct(to, left, resolution, projection, raw);
    const value: IInterval = {
      direct: corrected?.kind === "accepted",
      boundary: corrected?.kind === "accepted" ? corrected.anchor : undefined,
    };
    intervals.set(key, value);

    // This is a retained-work budget, not a physical grid or an error limit.
    // Eviction affects recomputation only; nodes contain no linked children.
    if (intervals.size > INTERVAL_CAPACITY)
      intervals.delete(intervals.keys().next().value!);
    return value;
  }

  /** Resolve a boundary through canonical left-before-right subdivision only. */
  function boundary(
    from: number,
    to: number,
    left: IAnchor,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): IAnchor | undefined {
    const node: IInterval = interval(from, to, left, resolution, projection);
    if (node.boundary !== undefined) return node.boundary ?? undefined;
    const middle: number = from + (to - from) / 2;
    const anchor: IAnchor | undefined =
      middle === from || middle === to
        ? undefined
        : boundary(from, middle, left, resolution, projection);
    node.boundary =
      anchor === undefined
        ? null
        : (boundary(middle, to, anchor, resolution, projection) ?? null);
    return node.boundary ?? undefined;
  }
  return { interval, boundary };
}

/** What the intervals of a free-leg curve read and what they are. */
export namespace HumanFreeCurveIntervals {
  /** What a free-leg curve builds its intervals from. */
  export interface IScope {
    /**
     * The curve's authoring at a phase in [0,1].
     *
     * @param share The phase.
     * @returns The authored posture.
     */
    at: (share: number) => IAutoMovieMotionHumanPosture;

    /** The curve's retained interval records, by directed endpoints. */
    intervals: Map<string, IInterval>;

    /** The curve's correction (`HumanFreeCurveFit.IFits.correct`). */
    correct: HumanFreeCurveFit.IFits["correct"];
  }

  /** The interval readers. */
  export interface IIntervals {
    /**
     * One canonical directed dyadic interval, classified once.
     *
     * @param from The interval's start phase.
     * @param to The interval's end phase.
     * @param left The anchor at its start.
     * @param resolution The borrowed forward-kinematics source, if any.
     * @param projection The borrowed range-of-motion projector, if any.
     * @returns The interval's record.
     */
    interval: (
      from: number,
      to: number,
      left: IAnchor,
      resolution: Parameters<typeof prepareHumanPoseResolution>[0],
      projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
    ) => IInterval;

    /**
     * An interval's boundary anchor, through canonical subdivision only.
     *
     * @param from The interval's start phase.
     * @param to The interval's end phase.
     * @param left The anchor at its start.
     * @param resolution The borrowed forward-kinematics source, if any.
     * @param projection The borrowed range-of-motion projector, if any.
     * @returns The anchor at its end, or undefined for an exhausted path.
     */
    boundary: (
      from: number,
      to: number,
      left: IAnchor,
      resolution: Parameters<typeof prepareHumanPoseResolution>[0],
      projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
    ) => IAnchor | undefined;
  }
  /** A canonical interval owns numeric anchors only, without child links or poses. */
  export interface IInterval {
    /**
     * Whether the original endpoint fit admits correcting interior requests
     * directly.
     */
    direct: boolean;
    /**
     * Validated endpoint of the canonical path, null if subdivision exhausted the
     * phase precision.
     */
    boundary: Boundary;
  }
}

/** A curve's numeric anchor (`HumanFreeCurveFit.IAnchor`). */
type IAnchor = HumanFreeCurveFit.IAnchor;

/** A curve's correction (`HumanFreeCurveFit.ICorrection`). */
type ICorrection = HumanFreeCurveFit.ICorrection;

/** A canonical interval's record (`HumanFreeCurveIntervals.IInterval`). */
type IInterval = HumanFreeCurveIntervals.IInterval;
/**
 * A validated previous foot and a current orientation goal bound a canonical
 * interval before IK. An accepted foot lies within ROM_TOLERANCE of its goal
 * and within STEP of the previous achieved orientation. A second ROM tolerance
 * is reserved for the independently evaluated quaternion angles. This excludes
 * only a direct interval; its ordinary subdivision and every actual queried
 * target still use their original correction policies.
 */
function excludesFootTurn(
  raw: IAutoMovieMotionHumanPosture,
  prior: IAnchor,
): boolean {
  if (raw.rotation !== undefined || !HumanPostureRaw.eligible(raw))
    return false;
  const goals: readonly IAutoMovieHumanLimbGoal[] = Object.values(raw.limbs);
  if (goals.length * 3 !== prior.rotations.length) return false;
  for (let index: number = 0; index < goals.length; ++index) {
    const goal: IAutoMovieQuaternion | undefined = goals[index]!.rotation;
    if (goal === undefined) continue;
    const previous: IAutoMovieQuaternion = prior.rotations[3 * index + 2]!;
    const angle: number =
      (Quaternion.angleAfterNormalize(previous, Quaternion.normalize(goal)) *
        180) /
      Math.PI;
    if (angle > hingedArmSwivel.STEP + 2 * ROM_TOLERANCE) return true;
  }
  return false;
}

/**
 * Undefined before subdivision, null for an exhausted path, or its actual right
 * anchor.
 */
type Boundary = IAnchor | null | undefined;

/**
 * At most 1024 unlinked numerical interval records per owned curve; eviction
 * changes work only.
 */
const INTERVAL_CAPACITY: number = 1024;
