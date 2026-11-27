import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import type { IAutoMovieMotionHumanExerciseKey } from "@automovie/interface";
import { ExerciseKey } from "../../internal/ExerciseKey";
import type { IAutoMovieMotionHumanWorkoutKind } from "@automovie/interface";

/*
 * Hanging at the arms' length.
 */
export const hang = (
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanExerciseKey.IKey =>
  ExerciseKey.from(body, {}, { shoulder: 178, raise: 10, elbow: 3 });

/*
 * A hanging kind: both hands grip the bar.
 */
export const kind = (
  reps: number,
  route: IAutoMovieMotionHumanWorkoutKind["route"],
): IAutoMovieMotionHumanWorkoutKind => ({
  base: "hanging",
  anchor: "bar",
  pin: ["gripLeft", "gripRight"],
  supports: [
    { part: "leftHand", kind: "grip", prop: true },
    { part: "rightHand", kind: "grip", prop: true },
  ],
  enter: 1,
  count: reps,
  route,
});
