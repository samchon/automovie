import { IAutoMovieGait, IAutoMovieGaitLimb, IAutoMovieJointPose, IAutoMovieTransform } from "@automovie/interface";

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

const gaitRoot = (
  gait: IAutoMovieGait,
  time: number,
): IAutoMovieTransform | null => {
  if (gait.rootBob === undefined) return null;
  const rootBob = gait.rootBob;
  if (!Number.isFinite(rootBob.amplitude))
    throw new Error("gait root bob amplitude must be finite");
  if (!Number.isFinite(rootBob.phase))
    throw new Error("gait root bob phase must be finite");
  if (!Number.isFinite(rootBob.center))
    throw new Error("gait root bob center must be finite");

  const cycle = wrap01(time / gait.period + rootBob.phase);
  return {
    translation: {
      x: 0,
      y: rootBob.center + rootBob.amplitude * Math.sin(cycle * Math.PI * 2),
      z: 0,
    },
    rotation: IDENTITY_ROOT.rotation,
    scale: IDENTITY_ROOT.scale,
  };
};

const gaitJoints = (
  limbs: readonly IAutoMovieGaitLimb[],
  time: number,
  period: number,
): IAutoMovieJointPose[] => {
  const joints = new Map<IAutoMovieGaitLimb["bone"], IAutoMovieJointPose>();
  for (const limb of limbs) {
    let joint = joints.get(limb.bone);
    if (joint === undefined) {
      joint = {
        bone: limb.bone,
        flexion: null,
        abduction: null,
        twist: null,
      };
      joints.set(limb.bone, joint);
    }
    joint[limb.axis ?? "flexion"] = gaitLimbFlexion(limb, time, period);
  }
  return [...joints.values()];
};

const assertUniqueGaitAxes = (limbs: readonly IAutoMovieGaitLimb[]): void => {
  const seen = new Set<string>();
  for (const limb of limbs) {
    const axis = limb.axis ?? "flexion";
    const key = `${limb.bone}:${axis}`;
    if (seen.has(key))
      throw new Error(`duplicate gait row for ${limb.bone}.${axis}`);
    seen.add(key);
  }
};

const assertUniqueProfileGaitNames = (
  gaits: readonly IAutoMovieGait[],
): void => {
  const seen = new Set<string>();
  for (const gait of gaits) {
    if (seen.has(gait.name))
      throw new Error(`duplicate profile gait name ${gait.name}`);
    seen.add(gait.name);
  }
};

const IDENTITY_ROOT: Pick<IAutoMovieTransform, "rotation" | "scale"> = {
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

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
