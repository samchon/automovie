import type {
  IAutoMoviePhysicalBalanceReference,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalTargetInterval,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import { PhysicalTargetInterval as Interval } from "../PhysicalTargetInterval";
import { samplePhysicalTarget } from "../samplePhysicalTarget";

/**
 * The completed fitted balance reference at a replan boundary and the authored
 * placements at that same boundary. A replan in the next interval starts from
 * the previous plan's endpoint; a revision inside the interval starts at the
 * preceding native tick of the previous plan. Without a contiguous previous
 * plan there is no completed reference.
 */
export function physicalBalanceReference(
  input: IAutoMoviePhysicalBalanceReference.IInput,
): IAutoMoviePhysicalBalanceReference.IResult {
  const previous: IAutoMoviePhysicalTargetInterval.IPlan | undefined =
    input.previous;
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
        ([bone, goal]: [string, IAutoMovieSamplePhysicalTarget.IResult]): [
          string,
          IAutoMovieRigidTransform,
        ] => [bone, goal.pose],
      ),
    ),
    before: Object.fromEntries(
      input.body.profile.segments.map(
        (
          segment: IAutoMoviePhysicalSegment,
        ): [string, IAutoMovieRigidTransform] => [
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
