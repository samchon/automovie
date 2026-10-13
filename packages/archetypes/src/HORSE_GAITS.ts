import { IAutoMovieGait } from "@automovie/interface";
import { createQuadrupedGaitLimb } from "./createQuadrupedGaitLimb";
/**
 * The canonical horse gait library: the playground mount's walk/trot/gallop
 * vocabulary, plus a compact rear beat, expressed as profile data. The arm
 * bones are front legs and the leg bones are hind legs on this quadruped rig.
 * Seconds, phase turns, metre root bob and degree limb angles are conventional
 * authored motion data rather than equine measurements. HORSE_PROFILE retains
 * the same module-owned rows and playground binding samples them through the
 * engine; table construction allocates a fixed population once at module load.
 *
 * @author Samchon
 */
export const HORSE_GAITS: Record<
  "walk" | "trot" | "gallop" | "rear",
  IAutoMovieGait
> = {
  walk: {
    name: "walk",
    period: 1,
    rootBob: { amplitude: 0.01, phase: 0, center: 0.01 },
    limbs: [
      createQuadrupedGaitLimb("leftUpperArm", 0.5, 16, 0.58),
      createQuadrupedGaitLimb("rightUpperArm", 0, 16, 0.58),
      createQuadrupedGaitLimb("leftUpperLeg", 0.5, 16, 0.58),
      createQuadrupedGaitLimb("rightUpperLeg", 0, 16, 0.58),
      createQuadrupedGaitLimb("leftLowerArm", 0, 6.6, 0.58, 15.4),
      createQuadrupedGaitLimb("rightLowerArm", 0.5, 6.6, 0.58, 15.4),
      createQuadrupedGaitLimb("leftLowerLeg", 0, 6.6, 0.58, 15.4),
      createQuadrupedGaitLimb("rightLowerLeg", 0.5, 6.6, 0.58, 15.4),
      { bone: "spine", phase: 0, duty: 0.5, neutral: 4, amplitude: 1 },
      { bone: "neck", phase: 0.08, duty: 0.5, neutral: 6, amplitude: 2 },
    ],
  },
  trot: {
    name: "trot",
    period: 0.72,
    rootBob: { amplitude: 0.04, phase: 0, center: 0.05 },
    limbs: [
      createQuadrupedGaitLimb("leftUpperArm", 0.5, 28, 0.46),
      createQuadrupedGaitLimb("rightUpperArm", 0, 28, 0.46),
      createQuadrupedGaitLimb("leftUpperLeg", 0.5, 28, 0.46),
      createQuadrupedGaitLimb("rightUpperLeg", 0, 28, 0.46),
      createQuadrupedGaitLimb("leftLowerArm", 0, 12, 0.46, 28),
      createQuadrupedGaitLimb("rightLowerArm", 0.5, 12, 0.46, 28),
      createQuadrupedGaitLimb("leftLowerLeg", 0, 12, 0.46, 28),
      createQuadrupedGaitLimb("rightLowerLeg", 0.5, 12, 0.46, 28),
      { bone: "spine", phase: 0, duty: 0.5, neutral: 4, amplitude: 2 },
    ],
  },
  gallop: {
    name: "gallop",
    period: 0.6,
    rootBob: { amplitude: 0.065, phase: 0.25, center: 0.095 },
    limbs: [
      createQuadrupedGaitLimb("leftUpperArm", 0.56, 46, 0.38),
      createQuadrupedGaitLimb("rightUpperArm", 0.06, 46, 0.38),
      createQuadrupedGaitLimb("leftUpperLeg", 0.56, 46, 0.38),
      createQuadrupedGaitLimb("rightUpperLeg", 0.06, 46, 0.38),
      createQuadrupedGaitLimb("leftLowerArm", 0, 22, 0.38, 52),
      createQuadrupedGaitLimb("rightLowerArm", 0.5, 22, 0.38, 52),
      createQuadrupedGaitLimb("leftLowerLeg", 0, 22, 0.38, 52),
      createQuadrupedGaitLimb("rightLowerLeg", 0.5, 22, 0.38, 52),
      { bone: "spine", phase: 0.08, duty: 0.5, neutral: 8, amplitude: 3 },
      { bone: "neck", phase: 0.14, duty: 0.5, neutral: 8, amplitude: 3 },
    ],
  },
  rear: {
    name: "rear",
    period: 2.6,
    rootBob: { amplitude: 0.05, phase: 0, center: 0.01 },
    limbs: [
      {
        bone: "leftUpperArm",
        phase: 0,
        duty: 0.42,
        neutral: -56,
        amplitude: 22,
      },
      {
        bone: "rightUpperArm",
        phase: 0,
        duty: 0.42,
        neutral: -56,
        amplitude: 22,
      },
      createQuadrupedGaitLimb("leftLowerArm", 0.05, 22, 0.42, 88),
      createQuadrupedGaitLimb("rightLowerArm", 0.95, 22, 0.42, 88),
      {
        bone: "leftUpperLeg",
        phase: 0.08,
        duty: 0.5,
        neutral: 12,
        amplitude: 6,
      },
      {
        bone: "rightUpperLeg",
        phase: 0.08,
        duty: 0.5,
        neutral: 12,
        amplitude: 6,
      },
      createQuadrupedGaitLimb("leftLowerLeg", 0.1, 3, 0.5, 33),
      createQuadrupedGaitLimb("rightLowerLeg", 0.1, 3, 0.5, 33),
      { bone: "spine", phase: 0, duty: 0.42, neutral: -18.5, amplitude: 26.5 },
      { bone: "chest", phase: 0, duty: 0.42, neutral: -11, amplitude: 17 },
      { bone: "neck", phase: 0, duty: 0.42, neutral: -19, amplitude: 33 },
      { bone: "head", phase: 0.06, duty: 0.42, neutral: -4, amplitude: 22 },
    ],
  },
};
