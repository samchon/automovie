import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Shared interval clock and coherent pose/twist sampling for every fitted target owner. */
export namespace PhysicalTargetInterval {
  /** A causal plan ends at step/rate; a revision starts at the preceding integer native boundary. */
  export interface IPlan {
    /** Cached interval index; its ending clock is step divided by the declared cache rate. */
    step: number;
    /** Recovery-policy revision used to fit this plan; a new revision invalidates its remaining future. */
    revision: number;
    /** Local seconds at this plan's start on the declared integer native-tick grid. */
    start: number;
    /** Coherent world bone poses at start, retaining the completed prefix when a revision replans. */
    from: Record<string, P.ITransform>;
    /** Fitted world bone poses at the complete cached interval end. */
    targets: Record<string, P.ITransform>;
  }

  /** Retain the completed prefix when an in-interval policy revision changes its future goal. */
  export function plan(input: {
    step: number;
    revision: number;
    seconds: number;
    rate: number;
    nativeRate: number;
    previous?: IPlan;
    initial: Record<string, P.ITransform>;
    targets: Record<string, P.ITransform>;
  }): IPlan {
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
                  ReturnType<typeof samplePhysicalTarget>,
                ]): [string, P.ITransform] => [bone, goal.pose],
              ),
            )
          : input.previous?.step === input.step - 1
            ? input.previous.targets
            : input.initial,
      targets: input.targets,
    };
  }

  /** Sample only within the admitted plan, preserving both interval endpoints. */
  export function fraction(plan: IPlan, seconds: number, rate: number): number {
    return Math.max(
      0,
      Math.min(1, (seconds - plan.start) / (plan.step / rate - plan.start)),
    );
  }

  /** Derivatives use the same remaining interval as the interpolated world poses. */
  export function sample(
    plan: IPlan,
    seconds: number,
    rate: number,
    selection?: ReadonlySet<string>,
  ): Record<string, ReturnType<typeof samplePhysicalTarget>> {
    const result: Record<
      string,
      ReturnType<typeof samplePhysicalTarget>
    > = Object.create(null);
    for (const [bone, pose] of Object.entries(plan.targets))
      if (selection === undefined || selection.has(bone))
        result[bone] = samplePhysicalTarget(
          plan.from[bone]!,
          pose,
          fraction(plan, seconds, rate),
          1 / (plan.step / rate - plan.start),
        );
    return result;
  }
}
