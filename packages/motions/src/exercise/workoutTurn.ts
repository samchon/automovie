import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";
import { WorkoutStance } from "./WorkoutStance";

/**
 * A full turn on the left foot's ball with the arms as given at its half: a
 * workout kind of three steps, stood, half turned and closed.
 *
 * @param seconds Each half turn's seconds.
 * @param arms The arms at the half turn.
 * @returns The turn's workout kind.
 */
export function workoutTurn(
  seconds: number,
  arms: IAutoMovieMotionHumanExerciseKey.ILimb,
): IAutoMovieMotionHumanWorkoutKind {
  return WorkoutStance.of(
    ["leftToes"],
    [{ part: "leftFoot", kind: "pivot" }],
    0,
    1,
    (
      body: IAutoMovieMotionHumanBody,
    ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
      WorkoutKind.step(ExerciseKey.standing(body), 0, "reset", "stood"),
      WorkoutKind.step(
        ExerciseKey.from(body, { yaw: 180 }, arms, {}, { hip: 25, knee: 50 }),
        seconds,
        "turn",
        "half",
      ),
      WorkoutKind.step(
        { ...ExerciseKey.standing(body), yaw: 360 },
        seconds,
        "close",
        "full",
      ),
    ],
  );
}
