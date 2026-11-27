import type { IAutoMovieMotionHumanExerciseKey, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanWorkoutKind } from "@automovie/interface";

import { ExerciseKey } from "../../internal/ExerciseKey";

import { WorkoutStance } from "../WorkoutStance";
import { WorkoutKind } from "../WorkoutKind";

export namespace WorkoutGymData {
  /*
   * A key from the whole body's part and the limbs' angles, on the body it is
   * built for (`ExerciseKey.from`).
   */
  export const key =
    (
      trunk: IAutoMovieMotionHumanExerciseKey.ITrunk,
      both: IAutoMovieMotionHumanExerciseKey.ILimb,
    ): Keyed =>
    (body: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanExerciseKey.IKey =>
      ExerciseKey.from(body, trunk, both);

  /*
   * A squat's bottom: the trunk pitched, the knees bent over shanks that lean,
   * with the arms as given.
   */
  export const squat = (
    pitch: number,
    knee: number,
    shank: number,
    arms: IAutoMovieMotionHumanExerciseKey.ILimb,
  ): Keyed =>
    key(
      { pitch, neck: -10 },
      { ...ExerciseKey.stood(pitch, knee, shank), ...arms },
    );

  /*
   * A standing kind on both feet whose repetition goes between two keys.
   */
  export const pair = (
    reps: number,
    low: readonly [Keyed, number, string, string],
    high: readonly [Keyed, number, string, string],
  ): IAutoMovieMotionHumanWorkoutKind =>
    WorkoutStance(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      0.8,
      reps,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(low[0](body), low[1], low[2], low[3]),
        WorkoutKind.step(high[0](body), high[1], high[2], high[3]),
      ],
    );

  /*
   * A key of the body's, built once the body is known.
   */
  export type Keyed = (
    body: IAutoMovieMotionHumanBody,
  ) => IAutoMovieMotionHumanExerciseKey.IKey;
}
