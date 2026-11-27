import type {
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

/** Companion types of {@link WorkoutKind}. */
export namespace WorkoutKind {
  /**
   * A step of a counted repetition.
   *
   * @param key The posture.
   * @param seconds Seconds taken to reach it.
   * @param leave The event at which the body leaves for it.
   * @param event The event at which it arrives.
   * @param hold Seconds stayed in it; 0 when absent.
   * @returns The step.
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

  /**
   * A step that is held: a stretch's or a pose's end, entered over `seconds`
   * (`reach` to `reachEnd`) and stayed in for `hold` seconds unless the author
   * names a hold.
   *
   * @param key The posture.
   * @param seconds Seconds taken to reach it.
   * @param hold Seconds stayed in it when the author names none.
   * @returns The step.
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
