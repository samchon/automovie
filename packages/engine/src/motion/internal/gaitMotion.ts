import {
  IAutoMovieGait,
  IAutoMovieGaitLimb,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieTransform,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineTransform } from "../../math/AutoMovieEngineTransform";
import { addPositiveModulo } from "../../math/internal/addPositiveModulo";
import { positiveModulo } from "../../math/internal/positiveModulo";
import { gaitLimbFlexion } from "./gaitLimbFlexion";

/*
 * Bake one declarative gait cycle into samples+1 evenly timed clinical poses,
 * including a closing copy of cycle phase. Optional phase is seconds into the
 * cycle; gaitCycle records the wrapped seed, and rig-specific ROM validation
 * remains the consumer's responsibility.
 */
export const gaitMotion: (
  id: string,
  skeleton: string,
  gait: IAutoMovieGait,
  samples: number,
  phase?: number,
) => IAutoMovieMotion = (
  id: string,
  skeleton: string,
  gait: IAutoMovieGait,
  samples: number,
  phase: number = 0,
): IAutoMovieMotion => {
  if (samples < 1) throw new Error("gait samples must be a positive integer");
  if (!(gait.period > 0))
    throw new Error("gait period must be finite and positive");
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

/*
 * Wrap a cycle position into `[0, 1)`.
 */
function wrap01(x: number): number {
  return positiveModulo(x, 1);
}

function gaitRoot(
  gait: IAutoMovieGait,
  time: number,
): IAutoMovieTransform | null {
  if (gait.rootBob === undefined) return null;
  const rootBob: NonNullable<IAutoMovieGait["rootBob"]> = gait.rootBob;

  const cycle: number = wrap01(time / gait.period + rootBob.phase);
  return AutoMovieEngineTransform.of(
    {
      x: 0,
      y: rootBob.center + rootBob.amplitude * Math.sin(cycle * Math.PI * 2),
      z: 0,
    },
    AutoMovieEngineQuaternion.identity(),
  );
}

function gaitJoints(
  limbs: readonly IAutoMovieGaitLimb[],
  time: number,
  period: number,
): IAutoMovieJointPose[] {
  const joints: Map<IAutoMovieGaitLimb["bone"], IAutoMovieJointPose> =
    new Map();
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
}

function assertUniqueGaitAxes(limbs: readonly IAutoMovieGaitLimb[]): void {
  const seen: Set<string> = new Set<string>();
  for (const limb of limbs) {
    const axis: NonNullable<IAutoMovieGaitLimb["axis"]> =
      limb.axis ?? "flexion";
    const key: string = `${limb.bone}:${axis}`;
    if (seen.has(key))
      throw new Error(`duplicate gait row for ${limb.bone}.${axis}`);
    seen.add(key);
  }
}
