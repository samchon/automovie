import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanBendScope } from "./AutoMovieMotionHumanBendScope";

/**
 * A planner's reader of its arms' goals (`AutoMovieMotionHumanArmPlanned`):
 * each arm's goal at an instant as the plan perceives it
 * (`AutoMovieMotionHumanArmObservation.aim`), read once an instant, inside
 * the arm's elbow scope (`AutoMovieMotionHumanBendScope`) seeded with the
 * elbow of the latest instant before it already read: a goal whose hand
 * target places its elbow by the elbow search continues that elbow in place
 * of sweeping the swivel circle cold at every instant (a bimanual carry read
 * 154 cold searches).
 *
 * @param body The performer's body.
 * @param carries The planned arms, in the problem's order.
 * @param at The posture so far at an instant.
 * @param resolution The plan's FK reader.
 * @param projection The body's ROM projector.
 * @returns The goal of arm `a` at second `t`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, once per instant, the continuation and its reason.
 * @evidence contracts/development/implementation.md#principled-implementation Numerical continuation of the elbow along the plan's time: the latest earlier instant's seed starts the next instant's search (`AutoMovieMotionHumanBendWalk.next`), which sweeps cold where the continuation leaves the allowed places.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One table of goals and one of seeds per arm; the scope carries the seed into the hand target's own search.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal is the observation's own; only the start of its elbow search is the earlier instant's, and a request outside the allowed places still takes its fallback or refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms A goal read once per arm and instant; an elbow search continued in a refinement's probes where it was a cold sweep of the circle; the seeds are kept sorted by instant, a linear insertion a read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A read instant's goal is the plan's value at that instant, kept for the plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One goal and one seed per arm and instant read, released with the plan.
 */
export function AutoMovieMotionHumanArmAimed(
  body: IAutoMovieMotionHumanBody,
  carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[],
  at: (t: number) => { posture: IAutoMovieMotionHumanPosture },
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
): (a: number, t: number) => IAutoMovieHumanLimbGoal {
  const goals: Map<number, IAutoMovieHumanLimbGoal>[] = carries.map(
    (): Map<number, IAutoMovieHumanLimbGoal> => new Map(),
  );
  const elbows: { times: number[]; seeds: (IAutoMovieSwivelSeed | undefined)[] }[] =
    carries.map((): { times: number[]; seeds: (IAutoMovieSwivelSeed | undefined)[] } => ({ times: [], seeds: [] }));
  return (a: number, t: number): IAutoMovieHumanLimbGoal => {
    let found: IAutoMovieHumanLimbGoal | undefined = goals[a]!.get(t);
    if (found !== undefined) return found;
    const table: { times: number[]; seeds: (IAutoMovieSwivelSeed | undefined)[] } = elbows[a]!;
    let index: number = 0;
    while (index < table.times.length && table.times[index]! < t) ++index;
    const before: IAutoMovieSwivelSeed | undefined = index > 0 ? table.seeds[index - 1] : undefined;
    const scope: AutoMovieMotionHumanBendScope.IScope = {
      body,
      side: carries[a]!.side,
      ...(before === undefined ? {} : { seed: before }),
    };

    // The posture is read outside the scope: only this goal's own elbow
    // search continues the arm's elbow.
    const posture: IAutoMovieMotionHumanPosture = at(t).posture;
    found = AutoMovieMotionHumanBendScope.within(scope, (): IAutoMovieHumanLimbGoal =>
      AutoMovieMotionHumanArmObservation.aim(carries[a]!, posture, t, resolution, projection));
    table.times.splice(index, 0, t);
    table.seeds.splice(index, 0, scope.seed);
    goals[a]!.set(t, found);
    return found;
  };
}
