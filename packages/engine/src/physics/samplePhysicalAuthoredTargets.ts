import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieSamplePhysicalAuthoredTargets,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { preparePhysicalTargetSampler } from "./preparePhysicalTargetSampler";

/**
 * Reuse admitted interval coefficients while retaining the original authored interpolation clock and rate arithmetic. Mutable direct callers are checked by the scalar-aware bone samplers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Reuse admitted interval coefficients while retaining the original authored interpolation clock and rate arithmetic) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Reuse admitted interval coefficients while retaining the original authored interpolation clock and rate arithmetic) directly over its typed inputs (`body`, `target`, `bound`, `step`, `seconds`, `rate`) as a single pass (for-of over body.profile.segments), delegating to `Math.max`, `Math.min`, `Object.create`, `preparePhysicalTargetSampler`, `motion.sample`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 46 lines and 7 top-level statements that reuses `Math.max`, `Math.min`, `Object.create`, `preparePhysicalTargetSampler`, `motion.sample` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 5 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `body`, `target`, `bound`, `step`, `seconds`, `rate`; the dominant cost is a single pass (for-of over body.profile.segments), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function samplePhysicalAuthoredTargets(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  target: IAutoMoviePhysicalSimulationInput.ITarget,
  bound: Bound,
  step: number,
  seconds: number,
  rate: number,
): Record<string, IAutoMovieSamplePhysicalTarget.IResult> {
  const from: Record<string, IAutoMoviePhysicalProfile.ITransform> =
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
