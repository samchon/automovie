import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeCourse, AutoMovieArchetypeRide } from "../core";
import type { EquineJump } from "./EquineJump";
import type { EquineObstacle } from "./EquineObstacle";
import type { QuadrupedRideClock } from "./QuadrupedRideClock";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";

/**
 * One trial assembly of a jump's ride, as the flight planner measures it: its stride plan, its clock and its displayed parts at a second.
 *
 * @param strides The trial's stride plan.
 * @param clock The trial's clock.
 * @param posed The trial's pose function.
 * @param plan The course plan the trial rides.
 * @param centre The animal's rest centre of mass, model metres.
 * @returns The trial.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the trial's members.
 * @evidence contracts/development/implementation.md#principled-implementation The sample reads the course state at the second and the posed parts and placement there.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One pose per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the trial's own pose function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the trial's functions.
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
      return { parts: shown.archetype.parts, placement: shown.placement };
    },
  };
}
