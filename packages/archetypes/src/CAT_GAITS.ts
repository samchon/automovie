import { IAutoMovieGait } from "@automovie/interface";
import { createQuadrupedGaitLimb } from "./createQuadrupedGaitLimb";
/**
 * Two conventional tail channels for one finger-named catalogue bone: phase-bearing abduction and phase-zero flexion about the supplied degree neutral. Phase is in turns and amplitude in degrees; the flexion oscillation is fifteen percent with a one-degree minimum. Each call allocates two new rows with shared easeInOut halves and retains no state.
 */
function tail(
  bone: "leftLittleProximal" | "leftLittleIntermediate" | "leftLittleDistal",
  phase: number,
  neutral: number,
  amplitude: number,
): IAutoMovieGait["limbs"][number][] { return [
  {
    bone,
    axis: "abduction",
    phase,
    duty: 0.5,
    neutral: 0,
    amplitude,
    swingEasing: "easeInOut",
    stanceEasing: "easeInOut",
  },
  {
    bone,
    phase: 0,
    duty: 0.5,
    neutral,
    amplitude: Math.max(1, amplitude * 0.15),
    swingEasing: "easeInOut",
    stanceEasing: "easeInOut",
  },
]; }

/**
 * The canonical cat gait library: walk/leap/stalk as reusable profile data for
 * a quadruped rig whose arm bones are front legs and leg bones are hind legs.
 * Periods use seconds, phases use turns, root bob uses metres and angular
 * channels use degrees. These are authored conventional motions, not measured
 * feline anatomy. CAT_PROFILE shares the module-owned rows with host contexts;
 * engine gait sampling owns validation and per-frame evaluation. Construction
 * is fixed catalogue work, with no per-frame cache or external resource.
 *
 * @author Samchon
 */
export const CAT_GAITS: Record<"walk" | "leap" | "stalk", IAutoMovieGait> = {
  walk: {
    name: "walk",
    period: 0.8,
    rootBob: { amplitude: 0.004, phase: 0.5, center: -0.004 },
    limbs: [
      createQuadrupedGaitLimb("leftUpperArm", 0.5, 24, 0.56),
      createQuadrupedGaitLimb("rightUpperArm", 0, 24, 0.56),
      createQuadrupedGaitLimb("leftUpperLeg", 0, 24, 0.56),
      createQuadrupedGaitLimb("rightUpperLeg", 0.5, 24, 0.56),
      createQuadrupedGaitLimb("leftLowerArm", 0, 11, 0.56, 25),
      createQuadrupedGaitLimb("rightLowerArm", 0.5, 11, 0.56, 25),
      createQuadrupedGaitLimb("leftLowerLeg", 0.5, 13, 0.56, 31),
      createQuadrupedGaitLimb("rightLowerLeg", 0, 13, 0.56, 31),
      ...tail("leftLittleProximal", 0, -18, 11),
      ...tail("leftLittleIntermediate", 0, -14, 13),
      ...tail("leftLittleDistal", 0, -10, 15),
      { bone: "head", phase: 0, duty: 0.5, neutral: -4, amplitude: 1 },
    ],
  },
  leap: {
    name: "leap",
    period: 1,
    rootBob: { amplitude: 0.185, phase: 0.8, center: 0.055 },
    limbs: [
      {
        bone: "leftUpperArm",
        phase: 0,
        duty: 0.36,
        neutral: -17,
        amplitude: 17,
        swingEasing: "easeOut",
        stanceEasing: "easeInOut",
      },
      {
        bone: "rightUpperArm",
        phase: 0,
        duty: 0.36,
        neutral: -17,
        amplitude: 17,
        swingEasing: "easeOut",
        stanceEasing: "easeInOut",
      },
      createQuadrupedGaitLimb("leftLowerArm", 0.45, 5, 0.36, 47),
      createQuadrupedGaitLimb("rightLowerArm", 0.45, 5, 0.36, 47),
      {
        bone: "leftUpperLeg",
        phase: 0,
        duty: 0.36,
        neutral: -2,
        amplitude: 36,
        swingEasing: "easeOut",
        stanceEasing: "easeInOut",
      },
      {
        bone: "rightUpperLeg",
        phase: 0,
        duty: 0.36,
        neutral: -2,
        amplitude: 36,
        swingEasing: "easeOut",
        stanceEasing: "easeInOut",
      },
      createQuadrupedGaitLimb("leftLowerLeg", 0, 17, 0.36, 75),
      createQuadrupedGaitLimb("rightLowerLeg", 0, 17, 0.36, 75),
      { bone: "neck", phase: 0, duty: 0.5, neutral: 5, amplitude: 17 },
      { bone: "head", phase: 0, duty: 0.5, neutral: 9, amplitude: 9 },
      ...tail("leftLittleProximal", 0.25, -18, 8),
      ...tail("leftLittleIntermediate", 0.25, -14, 9),
      ...tail("leftLittleDistal", 0.25, -10, 10),
    ],
  },
  stalk: {
    name: "stalk",
    period: 1.2,
    rootBob: { amplitude: 0.01, phase: 0.5, center: -0.04 },
    limbs: [
      createQuadrupedGaitLimb("leftUpperArm", 0.5, 16, 0.68),
      createQuadrupedGaitLimb("rightUpperArm", 0, 16, 0.68),
      createQuadrupedGaitLimb("leftUpperLeg", 0, 16, 0.68),
      createQuadrupedGaitLimb("rightUpperLeg", 0.5, 16, 0.68),
      createQuadrupedGaitLimb("leftLowerArm", 0, 8, 0.68, 22),
      createQuadrupedGaitLimb("rightLowerArm", 0.5, 8, 0.68, 22),
      createQuadrupedGaitLimb("leftLowerLeg", 0.5, 10, 0.68, 27),
      createQuadrupedGaitLimb("rightLowerLeg", 0, 10, 0.68, 27),
      { bone: "spine", phase: 0, duty: 0.5, neutral: 12, amplitude: 4 },
      { bone: "chest", phase: 0.08, duty: 0.5, neutral: 8, amplitude: 3 },
      { bone: "neck", phase: 0, duty: 0.5, neutral: 8, amplitude: 4 },
      { bone: "head", phase: 0, duty: 0.5, neutral: -7, amplitude: 2 },
      ...tail("leftLittleProximal", 0.5, -18, 6),
      ...tail("leftLittleIntermediate", 0.5, -14, 7),
      ...tail("leftLittleDistal", 0.5, -10, 8),
    ],
  },
};
