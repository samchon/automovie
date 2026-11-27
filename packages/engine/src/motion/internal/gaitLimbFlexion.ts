import { IAutoMovieGaitLimb } from "@automovie/interface";

import { positiveModulo } from "../../math/internal/positiveModulo";
import { cubicBezierEasing } from "./cubicBezierEasing";
import { ease } from "./ease";

/** Wrap a cycle position into `[0, 1)`. */
function wrap01(x: number): number {
  return positiveModulo(x, 1);
}

function gaitPhaseEase(
  curve: IAutoMovieGaitLimb["stanceEasing"],
  bezier: IAutoMovieGaitLimb["stanceBezier"],
  t: number,
): number {
  return curve === "cubicBezier" && bezier !== undefined && bezier !== null
    ? cubicBezierEasing(bezier, t)
    : ease(curve ?? "linear", t);
}

/**
 * Evaluate one gait row's clinical-axis angle in degrees at cycle time t in
 * seconds. Stance sweeps +amplitude to -amplitude, swing returns, phase offsets
 * the wrapped cycle and neutral shifts both halves; optional easing shapes each
 * half.
 */
export function gaitLimbFlexion(
  limb: IAutoMovieGaitLimb,
  t: number,
  period: number,
): number {
  if (!(period > 0)) throw new Error("gait period must be finite and positive");
  if (!(limb.duty > 0))
    throw new Error("gait limb duty must be finite and in (0, 1)");
  if (!(limb.duty < 1))
    throw new Error("gait limb duty must be finite and in (0, 1)");

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
}
