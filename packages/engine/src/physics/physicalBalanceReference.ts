import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { PhysicalTargetInterval as Interval } from "./PhysicalTargetInterval";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * The completed fitted balance reference at a replan boundary and the authored
 * placements at that same boundary. A replan in the next interval starts from
 * the previous plan's endpoint; a revision inside the interval starts at the
 * preceding native tick of the previous plan. Without a contiguous previous
 * plan there is no completed reference.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The completed fitted balance reference at a replan boundary and the authored placements at that same boundary) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The completed fitted balance reference at a replan boundary and the authored placements at that same boundary) directly over its typed inputs (`input`) as 2 sequential passes (map over Object.entries(Interval.sample(previous,; map over input.body.profile.segments), delegating to `Math.max`, `Math.min`, `Object.fromEntries`, `Object.entries(Interval.sample(previous, input.sta`, `Object.entries`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 36 lines and 5 top-level statements that reuses `Math.max`, `Math.min`, `Object.fromEntries`, `Object.entries(Interval.sample(previous, input.sta`, `Object.entries` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is 2 sequential passes (map over Object.entries(Interval.sample(previous,; map over input.body.profile.segments), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalBalanceReference(input: {
  /** Body whose authored targets bound the interval. */ body: Simulation.IBody;
  /** Current interval's authored end target. */ target: Simulation.ITarget;
  /** The previous fitted plan, if any. */ previous: Interval.IPlan | undefined;
  /** Enclosing cache interval. */ step: number;
  /** Replan boundary, seconds on the native tick grid. */ start: number;
  /** Declared cache frequency, hertz. */ rate: number;
}):
  | {
      /** Fitted placements already delivered at the boundary. */ completed: Record<
        string,
        P.ITransform
      >;
      /** Authored placements at the same boundary. */ before: Record<
        string,
        P.ITransform
      >;
    }
  | undefined {
  const previous: Interval.IPlan | undefined = input.previous;
  if (previous?.step === input.step - 1)
    return {
      completed: previous.targets,
      before: input.body.targets[input.step - 1]!.segments,
    };
  if (previous?.step !== input.step) return undefined;
  const fraction: number = Math.max(
    0,
    Math.min(1, input.start * input.rate - (input.step - 1)),
  );
  return {
    completed: Object.fromEntries(
      Object.entries(Interval.sample(previous, input.start, input.rate)).map(
        ([bone, goal]: [string, ReturnType<typeof samplePhysicalTarget>]): [
          string,
          P.ITransform,
        ] => [bone, goal.pose],
      ),
    ),
    before: Object.fromEntries(
      input.body.profile.segments.map(
        (segment: P.ISegment): [string, P.ITransform] => [
          segment.bone,
          samplePhysicalTarget(
            input.body.targets[input.step - 1]!.segments[segment.bone]!,
            input.target.segments[segment.bone]!,
            fraction,
            input.rate,
          ).pose,
        ],
      ),
    ),
  };
}
