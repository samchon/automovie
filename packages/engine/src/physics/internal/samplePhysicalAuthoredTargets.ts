import type {
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalAuthoredTargets,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import type { IAutoMovieEnginePhysicalBinding as Bound } from "../IAutoMovieEnginePhysicalBinding";
import { preparePhysicalTargetSampler } from "./preparePhysicalTargetSampler";

/*
 * Reuse admitted interval coefficients while retaining the original authored
 * interpolation clock and rate arithmetic. Mutable direct callers are checked
 * by the scalar-aware bone samplers.
 */
export function samplePhysicalAuthoredTargets(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  target: IAutoMoviePhysicalSimulationInput.ITarget,
  bound: Bound,
  step: number,
  seconds: number,
  rate: number,
): Record<string, IAutoMovieSamplePhysicalTarget.IResult> {
  const from: Record<string, IAutoMovieRigidTransform> =
    body.targets[step - 1]!.segments;
  let prepared: IAutoMovieSamplePhysicalAuthoredTargets.IPlan | undefined =
    bound.authoredTargets.get(body.id);
  if (
    !prepared ||
    prepared.step !== step ||
    prepared.from !== from ||
    prepared.targets !== target.segments ||
    prepared.rate !== rate
  ) {
    prepared = { step, rate, from, targets: target.segments, bones: new Map() };
    bound.authoredTargets.set(body.id, prepared);
  }
  const fraction: number = Math.max(
    0,
    Math.min(1, seconds * rate - (step - 1)),
  );
  const result: Record<string, IAutoMovieSamplePhysicalTarget.IResult> =
    Object.create(null);
  for (const segment of body.profile.segments) {
    const bone: string = segment.bone;
    let motion: ReturnType<typeof prepared.bones.get> =
      prepared.bones.get(bone);
    if (
      !motion ||
      motion.before !== from[bone] ||
      motion.after !== target.segments[bone]
    ) {
      motion = {
        before: from[bone]!,
        after: target.segments[bone]!,
        sample: preparePhysicalTargetSampler(
          from[bone]!,
          target.segments[bone]!,
          rate,
        ),
      };
      prepared.bones.set(bone, motion);
    }
    result[bone] = motion.sample(fraction);
  }
  return result;
}
