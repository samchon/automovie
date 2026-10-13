import {
  IAutoMovieGait,
  IAutoMovieGaitLimb,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieTransform,
} from "@automovie/interface";

import { addPositiveModulo } from "../math/addPositiveModulo";
import { positiveModulo } from "../math/positiveModulo";
import { gaitLimbFlexion } from "./gaitLimbFlexion";

const IDENTITY_ROOT: Pick<IAutoMovieTransform, "rotation" | "scale"> = {
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};


/** Wrap a cycle position into `[0, 1)`. */
const wrap01: (x: number) => number = (x: number): number => positiveModulo(x, 1);

const gaitRoot: (gait: IAutoMovieGait, time: number) => IAutoMovieTransform | null = (
  gait: IAutoMovieGait,
  time: number,
): IAutoMovieTransform | null => {
  if (gait.rootBob === undefined) return null;
  const rootBob: NonNullable<IAutoMovieGait["rootBob"]> = gait.rootBob;
  if (!Number.isFinite(rootBob.amplitude))
    throw new Error("gait root bob amplitude must be finite");
  if (!Number.isFinite(rootBob.phase))
    throw new Error("gait root bob phase must be finite");
  if (!Number.isFinite(rootBob.center))
    throw new Error("gait root bob center must be finite");

  const cycle: number = wrap01(time / gait.period + rootBob.phase);
  return {
    translation: {
      x: 0,
      y: rootBob.center + rootBob.amplitude * Math.sin(cycle * Math.PI * 2),
      z: 0,
    },
    rotation: { ...IDENTITY_ROOT.rotation },
    scale: { ...IDENTITY_ROOT.scale },
  };
};

const gaitJoints: (limbs: readonly IAutoMovieGaitLimb [ ], time: number, period: number) => IAutoMovieJointPose [ ] = (
  limbs: readonly IAutoMovieGaitLimb[],
  time: number,
  period: number,
): IAutoMovieJointPose[] => {
  const joints: Map<IAutoMovieGaitLimb["bone"], IAutoMovieJointPose> = new Map();
  for (const limb of limbs) {
    let joint: IAutoMovieJointPose | undefined = joints.get(limb.bone);
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

const assertUniqueGaitAxes: (limbs: readonly IAutoMovieGaitLimb [ ]) => void = (limbs: readonly IAutoMovieGaitLimb[]): void => {
  const seen: Set<string> = new Set<string>();
  for (const limb of limbs) {
    const axis: NonNullable<IAutoMovieGaitLimb["axis"]> = limb.axis ?? "flexion";
    const key: string = `${limb.bone}:${axis}`;
    if (seen.has(key))
      throw new Error(`duplicate gait row for ${limb.bone}.${axis}`);
    seen.add(key);
  }
};


/**
 * Bake one declarative gait cycle into samples+1 evenly timed clinical poses, including a closing copy of cycle phase. Optional phase is seconds into the cycle; gaitCycle records the wrapped seed, and rig-specific ROM validation remains the consumer's responsibility.
 *
 * @evidence contracts/common.md#principled-implementation Samples the same wrapped phase for all limb rows and optional sinusoidal root bob; bone/axis rows aggregate into one joint per bone, and the closing sample wraps to the same phase for a looping clip.
 * @evidence contracts/common.md#clear-and-simple-design The synthesizer owns the sample clock, row aggregation and gaitCycle metadata; gaitLimbFlexion owns per-row stance/swing interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects invalid sample count, period, phase, root-bob scalars and duplicate bone/axis rows; all creatures use the same data-driven law rather than name-specific code.
 * @evidence contracts/common.md#meaningful-documentation States sample population, cycle closure, phase units, clinical output and the remaining rig-ROM gate.
 * @evidence contracts/performance.md#efficient-algorithms For S sample intervals and L limb rows, synthesis uses O((S+1)L) work and stores O((S+1)B) joints for B distinct bones; per-sample maps combine multiple axes without scanning prior joints.
 * @evidence contracts/performance.md#reuse-equivalent-work All rows at a frame share its sampleTime and each bone's joint record; identity root values are copied into caller-owned records, while no generated clip is memoized across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned clip owns sampled joints, roots and keyframes including nested rotation/scale; temporary per-frame maps are released, and module identity constants contain no growing population or handles.
 */
export const gaitMotion: (id: string, skeleton: string, gait: IAutoMovieGait, samples: number, phase?: number) => IAutoMovieMotion = (
  id: string,
  skeleton: string,
  gait: IAutoMovieGait,
  samples: number,
  phase: number = 0,
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
  const phaseAt: number = positiveModulo(phase, gait.period);
  const keyframes: IAutoMovieKeyframe[] = [];
  for (let i: number = 0; i <= samples; ++i) {
    const time: number = (i / samples) * gait.period;
    const sampleTime: number = addPositiveModulo(phaseAt, time, gait.period);
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
