import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanExerciseKey, IAutoMovieMotionHumanWorkoutKind } from "@automovie/interface";

import { ExerciseKey } from "../../internal/ExerciseKey";

export namespace WorkoutBodyweightData {
  /*
   * Lying on the back with the arms by the sides.
   */
  export const supine = (
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey =>
    ExerciseKey.from(body, { pitch: -90 }, { ankle: -20, elbow: 5 });

  /*
   * A kind done lying or sitting on the floor, the pelvis kept.
   */
  export const floor = (
    base: IAutoMovieMotionHumanWorkoutKind["base"],
    supports: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[],
    reps: number,
    route: IAutoMovieMotionHumanWorkoutKind["route"],
    alternate: boolean = false,
  ): IAutoMovieMotionHumanWorkoutKind => ({
    base,
    anchor: "hips",
    pin: ["leftUpperLeg", "rightUpperLeg"],
    supports,
    alternate,
    enter: 2.4,
    count: reps,
    route,
  });

  /*
   * The back bears.
   */
  export const BACK: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[] = [
    { part: "back", kind: "lie" },
  ];
}
