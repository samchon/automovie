import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";

/*
 * A planner's reader of its arms' goals (`AutoMovieMotionHumanArmPlanned`):
 * each arm's goal at an instant as the plan perceives it
 * (`AutoMovieMotionHumanArmObservation.aim`), read once an instant. A goal
 * whose hand target places its elbow by the elbow search searches it cold, so
 * its elbow is the circle's least-strain place at that instant whatever the
 * instants read before it.
 * Parameter carries: The planned arms, in the problem's order.
 * Parameter at: The posture so far at an instant.
 * Parameter resolution: The plan's FK reader.
 * Parameter projection: The body's ROM projector.
 * Returns: The goal of arm `a` at second `t`.
 */
export function motionHumanArmAimed(
  carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[],
  at: (t: number) => IAutoMovieMotionHumanArmAimedAt,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
): (a: number, t: number) => IAutoMovieHumanLimbGoal {
  const goals: Map<number, IAutoMovieHumanLimbGoal>[] = carries.map(
    (): Map<number, IAutoMovieHumanLimbGoal> => new Map(),
  );
  return (a: number, t: number): IAutoMovieHumanLimbGoal => {
    let found: IAutoMovieHumanLimbGoal | undefined = goals[a]!.get(t);
    if (found !== undefined) return found;
    found = AutoMovieMotionHumanArmObservation.aim(
      carries[a]!,
      at(t).posture,
      t,
      resolution,
      projection,
    );
    goals[a]!.set(t, found);
    return found;
  };
}

/*
 * The record of `IAutoMovieMotionHumanArmAimedAt`'s site.
 */
type IAutoMovieMotionHumanArmAimedAt = {
  posture: IAutoMovieMotionHumanPosture;
};
