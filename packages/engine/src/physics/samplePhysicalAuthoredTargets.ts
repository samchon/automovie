import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { preparePhysicalTargetSampler } from "./preparePhysicalTargetSampler";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

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
  body: Simulation.IBody,
  target: Simulation.ITarget,
  bound: Bound,
  step: number,
  seconds: number,
  rate: number,
): Record<string, ReturnType<typeof samplePhysicalTarget>> {
  const from: Record<string, P.ITransform> = body.targets[step - 1]!.segments;
  let prepared: samplePhysicalAuthoredTargets.IPlan | undefined =
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
  const result: Record<
    string,
    ReturnType<typeof samplePhysicalTarget>
  > = Object.create(null);
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

/**
 * Run-owned transient coefficients are reconstructed from input after checkpoint restore.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Run-owned transient coefficients are reconstructed from input after checkpoint restore) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Run-owned transient coefficients are reconstructed from input after checkpoint restore: companion namespace of 1 member (`IPlan`); units and frames named in its text: hertz. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `samplePhysicalAuthoredTargets` in packages/engine/src/physics/samplePhysicalAuthoredTargets.ts; its surface is the 1 member listed and the text shows 3 other files naming it, mostly packages/engine (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace samplePhysicalAuthoredTargets {
  /** One authored cached interval, independent of fitted controller plans. */
  export interface IPlan {
    /** Enclosing cache interval. */ step: number;
    /** Original cache frequency, hertz. */ rate: number;
    /** Original admitted start transforms. */ from: Record<
      string,
      P.ITransform
    >;
    /** Original admitted end transforms. */ targets: Record<
      string,
      P.ITransform
    >;
    /** Bone coefficient ownership with value-aware mutation checks. */ bones: Map<
      string,
      {
        /** Bound start-transform reference, with scalar invalidation. */ before: P.ITransform;
        /** Bound end-transform reference, with scalar invalidation. */ after: P.ITransform;
        /** Per-bone prepared interpolation and twist. */ sample: ReturnType<
          typeof preparePhysicalTargetSampler
        >;
      }
    >;
  }
}
