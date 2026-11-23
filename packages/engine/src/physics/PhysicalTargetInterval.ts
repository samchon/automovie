import type {
  IAutoMoviePhysicalTargetInterval,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import { preparePhysicalTargetSampler } from "./preparePhysicalTargetSampler";

/**
 * Shared interval clock and coherent pose/twist sampling for every fitted target owner.
 */
export namespace PhysicalTargetInterval {
  /**
   * Retain the completed prefix when an in-interval policy revision changes its future goal.
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
                ]): [string, IAutoMovieRigidTransform] => [bone, goal.pose],
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
        before: IAutoMovieRigidTransform;
        after: IAutoMovieRigidTransform;
        sample: (fraction: number) => IAutoMovieSamplePhysicalTarget.IResult;
      }
    >;
  }
> = new WeakMap();
