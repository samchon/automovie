import { IAutoMovieGait, IAutoMovieKeyframe, IAutoMovieMotion } from "@automovie/interface";
import { addPositiveModulo } from "../math/addPositiveModulo";
import { positiveModulo } from "../math/positiveModulo";

/**
 * Synthesise a **declarative gait** ({@link IAutoMovieGait}) into a looping
 * {@link IAutoMovieMotion}: the engine fattening a creature's characteristic
 * locomotion (per-limb phase / duty / amplitude) into per-frame flexion. The
 * result is an ordinary one-cycle clip (sampled at `samples` even steps, the
 * closing keyframe repeating the first for a seamless loop) that
 * `locomoteMotion` / `travelMotion` can drive across the floor.
 *
 * The same synthesiser produces a human walk, a horse's lateral-sequence walk,
 * a cat's stalk. The difference lives entirely in the gait data, not the code.
 *
 * `phase` slides the whole cycle by that many seconds (#1176): the clip's
 * keyframe at local time `t` samples the gait at `t + phase`, so a beat that
 * opens mid-stride resumes exactly where the previous beat's end-state
 * (`gaitPhase`) left the cycle instead of restarting it, the difference between
 * a continuous walk and a stutter at every cut. The wrapped cycle stays a
 * seamless loop for any constant phase.
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Synthesizes the profile's limb rows and root bob into one complete gait cycle.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Bakes a compact gait rule into deterministic loop keyframes and phase state.
 * @author Samchon
 */
export const gaitMotion = (
  id: string,
  skeleton: string,
  gait: IAutoMovieGait,
  samples: number,
  phase = 0,
): IAutoMovieMotion => {
  if (!Number.isInteger(samples))
    throw new Error("gait samples must be a positive integer");
  if (samples < 1) throw new Error("gait samples must be a positive integer");
  if (!Number.isFinite(gait.period))
    throw new Error("gait period must be finite and positive");
  if (!(gait.period > 0))
    throw new Error("gait period must be finite and positive");
  if (!Number.isFinite(phase)) throw new Error("gait phase must be finite");
  assertUniqueGaitAxes(gait.limbs);
  const phaseAt = positiveModulo(phase, gait.period);
  const keyframes: IAutoMovieKeyframe[] = [];
  for (let i = 0; i <= samples; ++i) {
    const time = (i / samples) * gait.period;
    const sampleTime = addPositiveModulo(phaseAt, time, gait.period);
    keyframes.push({
      time,
      pose: {
        skeleton,
        root: gaitRoot(gait, sampleTime),
        joints: gaitJoints(gait.limbs, sampleTime, gait.period),
      },
      expression: null,
      easing: "linear",
      bezier: null,
    });
  }
  return {
    id,
    skeleton,
    duration: gait.period,
    loop: true,
    keyframes,
    // The bake IS one cycle; a phase-seeded bake starts mid-stride, so its
    // local t = 0 sits at `phase` within the cycle: phase(t) = (phase + t) %
    // period, and the NEXT beat's end-state records the true stride position.
    gaitCycle: {
      period: gait.period,
      phaseAt,
    },
  };
};
