import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
} from "@automovie/interface";

import type { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";

/*
 * What the arms are read against at an instant: the pose with the planned
 * arms in it, the segments their goals keep clear of or lay the hands on
 * (another body's), what no human body carries, and, on an arm's hold, the
 * segments its hand rests on, another body's and its own. With two arms, each
 * also reads a base of its own (`IBase.arms`): every goal's cleared segments,
 * and only its own goal's rests, so a segment one hand rests on is no
 * obstacle or rest of the other arm unless a goal clears it (a steadying
 * palm's presented hand, which the ring hand slides onto); the other arm
 * itself is the crossing pair, read on its own course.
 * Parameter pose: The pose at the instant.
 * Parameter goals: Each arm's goal at the instant.
 * Parameter holding: Whether each arm is on its hold at the instant.
 * Returns: The base.
 */
export function motionHumanArmBase(
  pose: IAutoMoviePose,
  goals: readonly IAutoMovieHumanLimbGoal[],
  holding: readonly boolean[],
): HumanArmTrajectory.IProblem["bases"][number] {
  const externals: IAutoMovieMotionHumanColliders.IExternal[] = goals.flatMap(
    (
      goal: IAutoMovieHumanLimbGoal,
    ): IAutoMovieMotionHumanColliders.IExternal[] => [
      ...(goal.clearExternal ?? []),
    ],
  );
  const cleared: IAutoMovieMotionHumanColliders.IPlaced[] = goals.flatMap(
    (
      goal: IAutoMovieHumanLimbGoal,
    ): IAutoMovieMotionHumanColliders.IPlaced[] => [...(goal.clear ?? [])],
  );
  const rested = (
    a: number,
  ): readonly IAutoMovieMotionHumanColliders.IPlaced[] =>
    holding[a] === true ? (goals[a]!.rests ?? []) : [];
  const owned = (a: number): IAutoMovieHumanLimbGoal.OwnRests =>
    holding[a] === true ? (goals[a]!.restsOwn ?? []) : [];
  const rests: IAutoMovieMotionHumanColliders.IPlaced[] = goals.flatMap(
    (
      _: IAutoMovieHumanLimbGoal,
      a: number,
    ): IAutoMovieMotionHumanColliders.IPlaced[] => [...rested(a)],
  );
  const restsOwn: AutoMovieHumanoidBone[] = goals.flatMap(
    (_: IAutoMovieHumanLimbGoal, a: number): AutoMovieHumanoidBone[] => [
      ...owned(a),
    ],
  );
  const union: HumanArmTrajectory.IProblem["bases"][number] = {
    pose,
    others: [
      ...cleared,
      ...goals.flatMap(
        (
          goal: IAutoMovieHumanLimbGoal,
        ): IAutoMovieMotionHumanColliders.IPlaced[] => [
          ...(goal.rests ?? []),
        ],
      ),
    ],
    ...(rests.length === 0 ? {} : { rests }),
    ...(restsOwn.length === 0 ? {} : { restsOwn }),
    ...(externals.length === 0 ? {} : { externals }),
  };
  if (goals.length < 2) return union;
  return {
    ...union,
    arms: goals.map(
      (
        goal: IAutoMovieHumanLimbGoal,
        a: number,
      ): HumanArmTrajectory.IProblem["bases"][number] => ({
        pose,
        others: [...cleared, ...(goal.rests ?? [])],
        ...(rested(a).length === 0 ? {} : { rests: rested(a) }),
        ...(owned(a).length === 0 ? {} : { restsOwn: owned(a) }),
        ...(externals.length === 0 ? {} : { externals }),
      }),
    ),
  };
}
