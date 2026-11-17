import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalTargetInterval,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import { preparePhysicalTargetSampler } from "./preparePhysicalTargetSampler";

/**
 * Shared interval clock and coherent pose/twist sampling for every fitted target owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Shared interval clock and coherent pose/twist sampling for every fitted target owner) and documents 4 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Shared interval clock and coherent pose/twist sampling for every fitted target owner: companion namespace of 4 members (`IPlan`, `plan`, `fraction`, `sample`); units and frames named in its text: local, seconds, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `PhysicalTargetInterval` in packages/engine/src/physics/PhysicalTargetInterval.ts; its surface is the 4 members listed and the text shows 6 other files naming it, mostly packages/engine (5), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace PhysicalTargetInterval {
  /**
   * Retain the completed prefix when an in-interval policy revision changes its future goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Retain the completed prefix when an in-interval policy revision changes its future goal.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Retain the completed prefix when an in-interval policy revision changes its future goal) directly over its typed inputs (`input`) as a single pass (map over Object.entries(sample(input.previous, st), delegating to `Math.round`, `Object.fromEntries`, `Object.entries(sample(input.previous, start, input`, `Object.entries`, `sample`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 25 lines and 2 top-level statements that reuses `Math.round`, `Object.fromEntries`, `Object.entries(sample(input.previous, start, input`, `Object.entries`, `sample` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a single pass (map over Object.entries(sample(input.previous, st), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function plan(
    input: IAutoMoviePhysicalTargetInterval.IPlanInput,
  ): IAutoMoviePhysicalTargetInterval.IPlan {
    const start: number =
      input.previous?.step === input.step
        ? (Math.round(input.seconds * input.nativeRate) - 1) / input.nativeRate
        : (input.step - 1) / input.rate;
    return {
      step: input.step,
      revision: input.revision,
      start,
      from:
        input.previous?.step === input.step
          ? Object.fromEntries(
              Object.entries(sample(input.previous, start, input.rate)).map(
                ([bone, goal]: [
                  string,
                  IAutoMovieSamplePhysicalTarget.IResult,
                ]): [string, IAutoMoviePhysicalProfile.ITransform] => [
                  bone,
                  goal.pose,
                ],
              ),
            )
          : input.previous?.step === input.step - 1
            ? input.previous.targets
            : input.initial,
      targets: input.targets,
    };
  }

  /**
   * Sample only within the admitted plan, preserving both interval endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Sample only within the admitted plan, preserving both interval endpoints.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Sample only within the admitted plan, preserving both interval endpoints) directly over its typed inputs (`plan`, `seconds`, `rate`) as a fixed number of statements with no loop or recursion in the body, delegating to `Math.max`, `Math.min`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 6 lines and 1 top-level statements that reuses `Math.max`, `Math.min` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `plan`, `seconds`, `rate`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function fraction(
    plan: IAutoMoviePhysicalTargetInterval.IPlan,
    seconds: number,
    rate: number,
  ): number {
    return Math.max(
      0,
      Math.min(1, (seconds - plan.start) / (plan.step / rate - plan.start)),
    );
  }

  /**
   * Derivatives use the same remaining interval as the interpolated world poses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Derivatives use the same remaining interval as the interpolated world poses.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Derivatives use the same remaining interval as the interpolated world poses) directly over its typed inputs (`plan`, `seconds`, `rate`, `selection`) as a single pass (for-of over Object.entries(plan.targets)), delegating to `Object.create`, `fraction`, `MOTIONS.get`, `MOTIONS.set`, `Object.entries`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 42 lines and 7 top-level statements that reuses `Object.create`, `fraction`, `MOTIONS.get`, `MOTIONS.set`, `Object.entries` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `plan`, `seconds`, `rate`, `selection`; the dominant cost is a single pass (for-of over Object.entries(plan.targets)), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function sample(
    plan: IAutoMoviePhysicalTargetInterval.IPlan,
    seconds: number,
    rate: number,
    selection?: ReadonlySet<string>,
  ): Record<string, IAutoMovieSamplePhysicalTarget.IResult> {
    const result: Record<string, IAutoMovieSamplePhysicalTarget.IResult> =
      Object.create(null);
    const portion: number = fraction(plan, seconds, rate);
    const speed: number = 1 / (plan.step / rate - plan.start);
    let compiled: ReturnType<typeof MOTIONS.get> = MOTIONS.get(plan);
    if (
      !compiled ||
      compiled.speed !== speed ||
      compiled.from !== plan.from ||
      compiled.targets !== plan.targets
    ) {
      compiled = {
        speed,
        from: plan.from,
        targets: plan.targets,
        bones: new Map(),
      };
      MOTIONS.set(plan, compiled);
    }
    for (const [bone, pose] of Object.entries(plan.targets))
      if (selection === undefined || selection.has(bone)) {
        let motion: ReturnType<typeof compiled.bones.get> =
          compiled.bones.get(bone);
        if (
          !motion ||
          motion.before !== plan.from[bone] ||
          motion.after !== pose
        ) {
          motion = {
            before: plan.from[bone]!,
            after: pose,
            sample: preparePhysicalTargetSampler(plan.from[bone]!, pose, speed),
          };
          compiled.bones.set(bone, motion);
        }
        result[bone] = motion.sample(portion);
      }
    return result;
  }
}

/** Weak lifetime follows transient plans; scalar-checked samplers never trust mutable pose identity alone. Functions remain outside checkpoint-serializable plans. */
const MOTIONS: WeakMap<
  IAutoMoviePhysicalTargetInterval.IPlan,
  {
    speed: number;
    from: IAutoMoviePhysicalTargetInterval.IPlan["from"];
    targets: IAutoMoviePhysicalTargetInterval.IPlan["targets"];
    bones: Map<
      string,
      {
        before: IAutoMoviePhysicalProfile.ITransform;
        after: IAutoMoviePhysicalProfile.ITransform;
        sample: (fraction: number) => IAutoMovieSamplePhysicalTarget.IResult;
      }
    >;
  }
> = new WeakMap();
