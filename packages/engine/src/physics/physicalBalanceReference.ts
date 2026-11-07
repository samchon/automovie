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
