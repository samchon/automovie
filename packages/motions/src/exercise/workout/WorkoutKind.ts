import type {
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

/*
 * Companion types of WorkoutKind.
 */
export namespace WorkoutKind {
  /*
   * A step of a counted repetition.
   * Parameter key: The posture.
   * Parameter seconds: Seconds taken to reach it.
   * Parameter leave: The event at which the body leaves for it.
   * Parameter event: The event at which it arrives.
   * Parameter hold: Seconds stayed in it; 0 when absent.
   * Returns: The step.
   */
  export function step(
    key: IAutoMovieMotionHumanExerciseKey.IKey,
    seconds: number,
    leave: string,
    event: string,
    hold: number = 0,
  ): IAutoMovieMotionHumanWorkoutKind.IStep {
    return { key, seconds, hold, leave, event };
  }

  /*
   * A step that is held: a stretch's or a pose's end, entered over `seconds`
   * (`reach` to `reachEnd`) and stayed in for `hold` seconds unless the author
   * names a hold.
   * Parameter key: The posture.
   * Parameter seconds: Seconds taken to reach it.
   * Parameter hold: Seconds stayed in it when the author names none.
   * Returns: The step.
   */
  export function pose(
    key: IAutoMovieMotionHumanExerciseKey.IKey,
    seconds: number,
    hold: number,
  ): IAutoMovieMotionHumanWorkoutKind.IStep {
    return {
      key,
      seconds,
      hold,
      held: true,
      leave: "reach",
      event: "reachEnd",
    };
  }
}
