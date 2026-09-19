import { IAutoMovieGaitLimb } from "@automovie/interface";
import { positiveModulo } from "../math/positiveModulo";
import { cubicBezierEasing } from "./cubicBezierEasing";
import { ease } from "./ease";

/** Wrap a cycle position into `[0, 1)`. */
const wrap01 = (x: number): number => positiveModulo(x, 1);

const gaitPhaseEase = (
  curve: IAutoMovieGaitLimb["stanceEasing"],
  bezier: IAutoMovieGaitLimb["stanceBezier"],
  t: number,
): number =>
  curve === "cubicBezier" && bezier !== undefined && bezier !== null
    ? cubicBezierEasing(bezier, t)
    : ease(curve ?? "linear", t);

/**
 * One limb's flexion (degrees) at cycle time `t`. Over its **stance** fraction
 * (`duty`) the limb sweeps from `+amplitude` (forward-planted) to `−amplitude`
 * (pushed back), driving the body; over the remaining **swing** fraction it
 * lifts and recovers from `−amplitude` back to `+amplitude`. The `phase` offset
 * slides the whole cycle so limbs fall in sequence, and the swing is centered
 * on the limb's `neutral` (default 0) so a one-way joint like a knee stays on
 * its anatomical side of zero. Optional stance/swing easing curves shape each
 * half separately while preserving the same endpoints.
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Evaluates one declared limb row by phase, duty, amplitude, and neutral angle.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Turns compact gait data into a repeatable articulated sample.
 * @author Samchon
 */
export const gaitLimbFlexion = (
  limb: IAutoMovieGaitLimb,
  t: number,
  period: number,
): number => {
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

  const u = wrap01(t / period + limb.phase);
  const a = limb.amplitude;
  const swing =
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
