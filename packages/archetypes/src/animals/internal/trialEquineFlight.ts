import type { IAutoMovieVector3 } from "@automovie/interface";

import type {
  AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../../core/index";
import type { EquineJump } from "../EquineJump";
import type { EquineObstacle } from "../EquineObstacle";
import type { QuadrupedRideClock } from "../QuadrupedRideClock";
import type { QuadrupedStridePlan } from "../QuadrupedStridePlan";

/**
 * One trial assembly of a jump's ride, as the flight planner measures it: its
 * stride plan, its clock and its displayed parts at a second.
 *
 * @param strides The trial's stride plan.
 * @param clock The trial's clock.
 * @param posed The trial's pose function.
 * @param plan The course plan the trial rides.
 * @param centre The animal's rest centre of mass, model metres.
 * @returns The trial.
 */
export function trialEquineFlight<
  Affordance extends string,
  Dimension extends string,
>(
  strides: QuadrupedStridePlan.IPlan,
  clock: QuadrupedRideClock.IClock,
  posed: (
    state: AutoMovieArchetypeCourse.IState,
    seconds: number,
  ) => AutoMovieArchetypeRide.IPose<Affordance, Dimension>,
  plan: AutoMovieArchetypeCourse.IPlan,
  centre: IAutoMovieVector3,
): EquineJump.ITrial {
  return {
    strides,
    clock,
    centre,
    sample: (seconds: number): EquineObstacle.ISample => {
      const shown: AutoMovieArchetypeRide.IPose<Affordance, Dimension> = posed(
        plan.at(seconds),
        seconds,
      );
      const model: AutoMovieArchetype<Affordance, Dimension> = shown.archetype;
      return { parts: model.parts, cells: model.convexCells, placement: shown.placement };
    },
  };
}
