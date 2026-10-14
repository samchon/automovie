import { IAutoMovieGaitLimb } from "@automovie/interface";

import { positiveModulo } from "../math/positiveModulo";
import { cubicBezierEasing } from "./cubicBezierEasing";
import { ease } from "./ease";

/** Wrap a cycle position into `[0, 1)`. */
const wrap01: (x: number) => number = (x: number): number =>
  positiveModulo(x, 1);

const gaitPhaseEase: (
  curve: IAutoMovieGaitLimb["stanceEasing"],
  bezier: IAutoMovieGaitLimb["stanceBezier"],
  t: number,
) => number = (
  curve: IAutoMovieGaitLimb["stanceEasing"],
  bezier: IAutoMovieGaitLimb["stanceBezier"],
  t: number,
): number =>
  curve === "cubicBezier" && bezier !== undefined && bezier !== null
    ? cubicBezierEasing(bezier, t)
    : ease(curve ?? "linear", t);

/**
 * Evaluate one gait row's clinical-axis angle in degrees at cycle time t in seconds. Stance sweeps +amplitude to -amplitude, swing returns, phase offsets the wrapped cycle and neutral shifts both halves; optional easing shapes each half.
 *
 * @evidence contracts/common.md#principled-implementation Wraps t/period+phase into [0,1), splits at duty in (0,1), and interpolates opposite amplitude endpoints through stance/swing easing; the same scalar law can drive the gait row's selected clinical axis despite this legacy function name.
 * @evidence contracts/common.md#clear-and-simple-design One piecewise scalar evaluator owns the phase/duty law; gaitMotion owns bone/axis aggregation and cubicBezierEasing owns parameterized easing inversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid period, phase, duty, amplitude or authored neutral throws; no body or named gait is special-cased. Finite sample time and CSS-legal easing controls remain the caller's admitted input premise.
 * @evidence contracts/common.md#meaningful-documentation Gives degrees/seconds, wrapped phase, neutral default and the independent stance/swing easing meaning without guaranteeing a custom rig's ROM.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalar operations plus one bounded easing evaluation takes constant time and auxiliary space per limb row.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the selected stance or swing easing is evaluated at the current phase; no sampled trajectory is cached across mutable gait rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one angle and retains no gait row, frame history or external resource.
 */
export const gaitLimbFlexion: (
  limb: IAutoMovieGaitLimb,
  t: number,
  period: number,
) => number = (limb: IAutoMovieGaitLimb, t: number, period: number): number => {
  if (!Number.isFinite(period))
    throw new Error("gait period must be finite and positive");
  if (!(period > 0)) throw new Error("gait period must be finite and positive");
  if (!Number.isFinite(limb.phase))
    throw new Error("gait limb phase must be finite");
  if (!Number.isFinite(limb.duty))
    throw new Error("gait limb duty must be finite and in (0, 1)");
  if (!(limb.duty > 0))
    throw new Error("gait limb duty must be finite and in (0, 1)");
  if (!(limb.duty < 1))
    throw new Error("gait limb duty must be finite and in (0, 1)");
  if (!Number.isFinite(limb.amplitude))
    throw new Error("gait limb amplitude must be finite");
  if (limb.neutral !== undefined)
    if (!Number.isFinite(limb.neutral))
      throw new Error("gait limb neutral must be finite");

  const u: number = wrap01(t / period + limb.phase);
  const a: number = limb.amplitude;
  const swing: number =
    u < limb.duty
      ? a *
        (1 -
          2 *
            gaitPhaseEase(limb.stanceEasing, limb.stanceBezier, u / limb.duty))
      : -a +
        2 *
          a *
          gaitPhaseEase(
            limb.swingEasing,
            limb.swingBezier,
            (u - limb.duty) / (1 - limb.duty),
          );
  return (limb.neutral ?? 0) + swing;
};
