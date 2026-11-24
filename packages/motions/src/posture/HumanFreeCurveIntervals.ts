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
 * The knots of a free-leg curve (`prepareHumanFreeCurve`) from its origin
 * toward one end, solved in order when the curve is prepared: the knot chain
 * that splits the directed phase interval by canonical left-before-right
 * dyadic subdivision. An interval is direct when the actual targets at its
 * midpoint and at its end, each fitted from the knot at its start, meet the
 * original branch, swivel and rotation gates (`HumanFreeCurveFit.IFits.correct`):
 * the midpoint is the interval's interior probe, since an end alone can match
 * its start across an interior that leaves the start's basin (a movement that
 * returns). A direct interval adds both as knots; any other is halved and its
 * left half resolved first. The chain stops where the halving exhausts the
 * phase's binary64 precision, so the phases past its last knot have no
 * continuation and are fitted cold.
 *
 * @param scope The curve's authoring and correction, the directed interval
 *   and the knot at its start.
 * @returns The knots after the start toward the end, in that order.
 */
export function HumanFreeCurveIntervals(
  scope: HumanFreeCurveIntervals.IScope,
): HumanFreeCurveIntervals.IKnot[] {
  const { at, correct, resolution, projection }: HumanFreeCurveIntervals.IScope =
    scope;
  const knots: HumanFreeCurveIntervals.IKnot[] = [];
  let from: number = scope.from;
  let left: IAnchor = scope.origin;

  /** The actual target at a phase fitted from the knot at the start. */
  const fit: (share: number) => IAnchor | undefined = (
    share: number,
  ): IAnchor | undefined => {
    const raw: IAutoMovieMotionHumanPosture = at(share);
    if (excludesFootTurn(raw, left)) return undefined;
    const corrected: ICorrection = correct(
      share,
      left,
      resolution,
      projection,
      raw,
    );
    return corrected.kind === "accepted" ? corrected.anchor : undefined;
  };

  // The ends still to reach, the nearest on top.
  const pending: number[] = [scope.to];
  while (pending.length !== 0) {
    const to: number = pending[pending.length - 1]!;
    const middle: number = from + (to - from) / 2;
    if (middle === from || middle === to) break;
    const inner: IAnchor | undefined = fit(middle);
    const outer: IAnchor | undefined =
      inner === undefined ? undefined : fit(to);
    if (outer === undefined) {
      pending.push(middle);
      continue;
    }
    knots.push({ share: middle, anchor: inner! }, { share: to, anchor: outer });
    from = to;
    left = outer;
    pending.pop();
  }
  return knots;
}

/** What the knots of a free-leg curve are solved from, and what they are. */
export namespace HumanFreeCurveIntervals {
  /** What a free-leg curve's knots toward one end are solved from. */
  export interface IScope {
    /**
     * The curve's authoring at a phase in [0,1].
     *
     * @param share The phase.
     * @returns The authored posture.
     */
    at: (share: number) => IAutoMovieMotionHumanPosture;

    /** The curve's correction (`HumanFreeCurveFit.IFits.correct`). */
    correct: HumanFreeCurveFit.IFits["correct"];

    /** The phase of the knot the chain starts from. */
    from: number;

    /** The phase the chain heads to, 0 or 1. */
    to: number;

    /** The anchor at `from`. */
    origin: IAnchor;

    /** The native forward-kinematics source the knots are solved with. */
    resolution: Parameters<typeof prepareHumanPoseResolution>[0];

    /** The range-of-motion projector, if any. */
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined;
  }

  /** One knot: a phase and the anchor its correction reached there. */
  export interface IKnot {
    /** The phase, in [0,1]. */
    share: number;

    /** The anchor at it. */
    anchor: IAnchor;
  }
}

/** A curve's numeric anchor (`HumanFreeCurveFit.IAnchor`). */
type IAnchor = HumanFreeCurveFit.IAnchor;

/** A curve's correction (`HumanFreeCurveFit.ICorrection`). */
type ICorrection = HumanFreeCurveFit.ICorrection;

/**
 * A validated previous foot and a current orientation goal bound an interval
 * before IK. An accepted foot lies within ROM_TOLERANCE of its goal and within
 * STEP of the previous achieved orientation. A second ROM tolerance is reserved
 * for the independently evaluated quaternion angles. Such an interval is not
 * direct and is halved without a fit.
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
