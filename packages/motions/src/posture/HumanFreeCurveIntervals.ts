import { Quaternion, ROM_TOLERANCE, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import type { HumanFreeCurveFit } from "./HumanFreeCurveFit";
import { HumanPostureRaw } from "./HumanPostureRaw";
import { prepareHumanAdaptiveKnots } from "./internal/prepareHumanAdaptiveKnots";
import type { prepareHumanPoseResolution } from "./internal/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "./internal/prepareHumanPostureProjection";

/**
 * The knots of a free-leg curve (`prepareHumanFreeCurve`) from its origin
 * toward one end, solved when the curve is prepared: placed by AutoKnots
 * (Vitenti et al. 2024, arXiv:2412.13423; `prepareHumanAdaptiveKnots.seeded`)
 * on the legs' swivels, to the solver's own angular resolution
 * (`ROM_TOLERANCE`, degrees), each knot's solve seeded from the knot before it
 * toward the origin. A sub-interval converges only where the paper's criteria
 * hold and its midpoint's actual target, fitted from the sub-interval's knot
 * nearer the origin, meets the original branch, swivel and rotation gates
 * (`HumanFreeCurveFit.IFits.correct`): the midpoint is the interval's interior
 * probe, since an end alone can match its start across an interior that leaves
 * the start's basin (a movement that returns). Where a knot's fit fails its
 * gates the chain stops at the knot before it, so the phases past its last knot
 * have no continuation and are fitted cold.
 *
 * @param scope The curve's authoring and correction, the directed interval and
 *   the knot at its start.
 * @returns The knots after the start toward the end, in that order.
 */
export function HumanFreeCurveIntervals(
  scope: HumanFreeCurveIntervals.IScope,
): HumanFreeCurveIntervals.IKnot[] {
  const {
    at,
    correct,
    resolution,
    projection,
    origin,
  }: HumanFreeCurveIntervals.IScope = scope;
  const span: number = Math.abs(scope.to - scope.from);
  if (span === 0) return [];
  const sign: number = scope.to > scope.from ? 1 : -1;
  const limbs: AutoMovieHumanLimb[] = (
    Object.keys(origin.seeds) as AutoMovieHumanLimb[]
  ).filter((limb: AutoMovieHumanLimb): boolean => {
    const seed: IAutoMovieSwivelSeed | null | undefined = origin.seeds[limb];
    return seed !== null && seed !== undefined;
  });

  // Each leg's swivel, unwrapped against the knot the solve continues.
  const swivels = (
    anchor: IAnchor,
    near: readonly number[] | undefined,
  ): number[] =>
    limbs.map((limb: AutoMovieHumanLimb, c: number): number => {
      const swivel: number = anchor.seeds[limb]!.swivel;
      if (near === undefined) return swivel;
      const turn: number = swivel - near[c]!;
      return near[c]! + turn - 360 * Math.round(turn / 360);
    });
  const knots: prepareHumanAdaptiveKnots.ISeededKnots<IAnchor | undefined> =
    prepareHumanAdaptiveKnots.seeded<IAnchor | undefined>({
      from: 0,
      to: span,
      evaluate: (
        u: number,
        near: prepareHumanAdaptiveKnots.IPoint<IAnchor | undefined> | undefined,
      ): prepareHumanAdaptiveKnots.IPoint<IAnchor | undefined> => {
        if (near === undefined)
          return { values: swivels(origin, undefined), payload: origin };
        const prior: IAnchor | undefined = near.payload;
        if (prior === undefined)
          return { values: near.values, payload: undefined };
        const share: number = scope.from + sign * u;
        const raw: IAutoMovieMotionHumanPosture = at(share);
        if (excludesFootTurn(raw, prior))
          return { values: near.values, payload: undefined };
        const corrected: ICorrection = correct(
          share,
          prior,
          resolution,
          projection,
          raw,
        );
        return corrected.kind === "accepted"
          ? {
              values: swivels(corrected.anchor, near.values),
              payload: corrected.anchor,
            }
          : { values: near.values, payload: undefined };
      },
      // A sub-interval past the chain's end continues nothing, so only the
      // one the chain ends in is halved toward where its fit fails.
      accept: (
        middle: prepareHumanAdaptiveKnots.IPoint<IAnchor | undefined>,
        left: prepareHumanAdaptiveKnots.IPoint<IAnchor | undefined>,
      ): boolean => middle.payload !== undefined || left.payload === undefined,
      tolerance: { kind: "absolute", absolute: ROM_TOLERANCE },
    });

  // The chain from the origin outward, up to the first knot whose fit failed.
  const out: HumanFreeCurveIntervals.IKnot[] = [];
  for (let k: number = 1; k < knots.times.length; ++k) {
    const anchor: IAnchor | undefined = knots.payloads[k];
    if (anchor === undefined) break;
    out.push({ share: scope.from + sign * knots.times[k]!, anchor });
  }
  return out;
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
