import type { IAutoMovieMotionHumanWorkoutKind } from "@automovie/interface";

export namespace WorkoutLyingData {
  /*
   * The back bears.
   */
  export const SUPINE: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[] = [
    { part: "back", kind: "lie" },
  ];

  /*
   * The seat bears.
   */
  export const SEATED: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[] = [
    { part: "seat", kind: "seat" },
  ];
}
