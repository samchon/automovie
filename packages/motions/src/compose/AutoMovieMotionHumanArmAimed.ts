import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";

/**
 * A planner's reader of its arms' goals (`AutoMovieMotionHumanArmPlanned`):
 * each arm's goal at an instant as the plan perceives it
 * (`AutoMovieMotionHumanArmObservation.aim`), read once an instant. A goal
 * whose hand target places its elbow by the elbow search searches it cold,
 * so its elbow is the circle's least-strain place at that instant whatever
 * the instants read before it.
 *
 * @param carries The planned arms, in the problem's order.
 * @param at The posture so far at an instant.
 * @param resolution The plan's FK reader.
 * @param projection The body's ROM projector.
 * @returns The goal of arm `a` at second `t`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, once per instant, and that each elbow is searched on its own.
 * @evidence contracts/development/implementation.md#principled-implementation Every goal is the observation's own at its instant, its elbow the cold search's least-strain place, so a goal does not depend on the order instants are read in.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One table of goals per arm, keyed by the instant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal is borrowed from another instant; a request outside the allowed places still takes its fallback or refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms A goal read once per arm and instant.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A read instant's goal is the plan's value at that instant, kept for the plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One goal per arm and instant read, released with the plan.
 */
export function AutoMovieMotionHumanArmAimed(
  carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[],
  at: (t: number) => { posture: IAutoMovieMotionHumanPosture },
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
): (a: number, t: number) => IAutoMovieHumanLimbGoal {
  const goals: Map<number, IAutoMovieHumanLimbGoal>[] = carries.map(
    (): Map<number, IAutoMovieHumanLimbGoal> => new Map(),
  );
  return (a: number, t: number): IAutoMovieHumanLimbGoal => {
    let found: IAutoMovieHumanLimbGoal | undefined = goals[a]!.get(t);
    if (found !== undefined) return found;
    found = AutoMovieMotionHumanArmObservation.aim(carries[a]!, at(t).posture, t, resolution, projection);
    goals[a]!.set(t, found);
    return found;
  };
}
